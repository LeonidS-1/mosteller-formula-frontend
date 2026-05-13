/**
 * Swagger-codegen-style клиент (axios) для доменов «заявка» (prescriptions)
 * и связи «заявка–препарат / м-м» (prescription_drugs).
 * Препараты (drugs) и users — не включены: для них используется отдельный axios в модулях.
 */

export interface InvBackendSerializerDrugJSON {
  drug_id?: number;
  title?: string;
  description?: string;
  is_deleted?: boolean;
  photo_url?: string;
  video?: string;
  adult_dose_mg?: number;
  dose_per_m2_mg?: number;
  max_daily_mg?: number;
  short_description_en?: string;
}

export interface InvBackendSerializerPrescriptionJSON {
  prescription_id?: number;
  status?: string;
  created_at?: string;
  creator_login?: string;
  moderator_login?: string | null;
  forming_date?: string | null;
  finish_date?: string | null;
  doctor_full_name?: string;
  completed_dose_line_count?: number;
}

export interface InvBackendSerializerPrescriptionEditJSON {
  doctor_full_name?: string;
}

export interface InvBackendSerializerPrescriptionDrugJSON {
  prescription_id?: number;
  drug_id?: number;
  height_cm?: number;
  weight_kg?: number;
  dose?: number | null;
}

export interface InvBackendSerializerPrescriptionDrugDetailJSON {
  prescription_id?: number;
  drug_id?: number;
  height_cm?: number;
  weight_kg?: number;
  dose?: number | null;
  drug: InvBackendSerializerDrugJSON;
}

export interface InvBackendSerializerStatusJSON {
  status?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, unknown>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  secure?: boolean;
  path: string;
  type?: ContentType;
  query?: QueryParamsType;
  format?: ResponseType;
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export const ContentType = {
  Json: "application/json",
  JsonApi: "application/vnd.api+json",
  FormData: "multipart/form-data",
  UrlEncoded: "application/x-www-form-urlencoded",
  Text: "text/plain",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "//localhost:8080/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    }
    return `${formItem}`;
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: unknown[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = unknown>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    let reqBody: unknown = body;
    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      reqBody = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      reqBody = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: reqBody,
      url: path,
    });
  };
}

export class Api<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /** Связь препарата с рецептом (многие-ко-многим — м-м: рост, вес, доза) */
  prescriptionDrugLink = {
    addDrugToPrescriptionDraft: (drugId: number, params: RequestParams = {}) =>
      this.request<InvBackendSerializerPrescriptionJSON>({
        path: `/prescription_drugs/add/${drugId}`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    updatePrescriptionDrugLine: (
      drugId: number,
      prescriptionId: number,
      data: InvBackendSerializerPrescriptionDrugJSON,
      params: RequestParams = {},
    ) =>
      this.request<InvBackendSerializerPrescriptionDrugJSON>({
        path: `/prescription_drugs/${drugId}/${prescriptionId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    removePrescriptionDrugLine: (
      drugId: number,
      prescriptionId: number,
      params: RequestParams = {},
    ) =>
      this.request<InvBackendSerializerPrescriptionJSON>({
        path: `/prescription_drugs/${drugId}/${prescriptionId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),
  };

  /** Заявка-рецепт (prescriptions) */
  prescription = {
    prescriptionCart: (params: RequestParams = {}) =>
      this.request<Record<string, unknown>>({
        path: `/prescriptions/cart`,
        method: "GET",
        format: "json",
        ...params,
      }),

    listPrescriptions: (
      query?: {
        "from-date"?: string;
        "to-date"?: string;
        status?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<InvBackendSerializerPrescriptionJSON[]>({
        path: `/prescriptions`,
        method: "GET",
        query,
        secure: true,
        format: "json",
        ...params,
      }),

    prescriptionDetail: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, unknown>>({
        path: `/prescriptions/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    editPrescriptionDraft: (
      id: number,
      body: InvBackendSerializerPrescriptionEditJSON,
      params: RequestParams = {},
    ) =>
      this.request<InvBackendSerializerPrescriptionJSON>({
        path: `/prescriptions/${id}`,
        method: "PUT",
        body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    deletePrescription: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, string>>({
        path: `/prescriptions/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    formPrescription: (id: number, params: RequestParams = {}) =>
      this.request<InvBackendSerializerPrescriptionJSON>({
        path: `/prescriptions/${id}/form`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    finishPrescription: (
      id: number,
      status: InvBackendSerializerStatusJSON,
      params: RequestParams = {},
    ) =>
      this.request<InvBackendSerializerPrescriptionJSON>({
        path: `/prescriptions/${id}/finish`,
        method: "PUT",
        body: status,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
