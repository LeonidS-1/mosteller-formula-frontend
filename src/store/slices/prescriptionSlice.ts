import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api";
import type {
  InvBackendSerializerDrugJSON,
  InvBackendSerializerPrescriptionJSON,
  InvBackendSerializerPrescriptionDrugJSON,
} from "../../api/Api";
import type {
  DrugJSON,
  PrescriptionCartJSON,
  PrescriptionDetailResponse,
  PrescriptionJSON,
} from "../../modules/types";
import { apiErrMessage } from "../utils/apiError";
import { resetUserSession } from "./userSlice";

function mapDrug(s: InvBackendSerializerDrugJSON): DrugJSON {
  return {
    drug_id: Number(s.drug_id ?? 0),
    title: s.title ?? "",
    description: s.description ?? "",
    is_deleted: Boolean(s.is_deleted),
    photo_url: s.photo_url ?? "",
    video: s.video ?? "",
    adult_dose_mg: Number(s.adult_dose_mg ?? 0),
    dose_per_m2_mg: Number(s.dose_per_m2_mg ?? 0),
    max_daily_mg: Number(s.max_daily_mg ?? 0),
    short_description_en: s.short_description_en,
  };
}

function mapPrescriptionRow(p: InvBackendSerializerPrescriptionJSON): PrescriptionJSON {
  return {
    prescription_id: Number(p.prescription_id ?? 0),
    status: p.status ?? "",
    created_at: p.created_at != null ? String(p.created_at) : "",
    creator_login: p.creator_login ?? "",
    moderator_login: p.moderator_login ?? null,
    forming_date: p.forming_date ?? null,
    finish_date: p.finish_date ?? null,
    doctor_full_name: p.doctor_full_name ?? "",
    completed_dose_line_count: Number(p.completed_dose_line_count ?? 0),
  };
}

function prescriptionListsEqual(a: PrescriptionJSON[], b: PrescriptionJSON[]): boolean {
  if (a.length !== b.length) return false;
  const byId = (rows: PrescriptionJSON[]) =>
    [...rows].sort((x, y) => x.prescription_id - y.prescription_id);
  const left = byId(a);
  const right = byId(b);
  return left.every((row, i) => {
    const other = right[i];
    return (
      row.prescription_id === other.prescription_id &&
      row.status === other.status &&
      row.created_at === other.created_at &&
      row.creator_login === other.creator_login &&
      row.moderator_login === other.moderator_login &&
      row.forming_date === other.forming_date &&
      row.finish_date === other.finish_date &&
      row.doctor_full_name === other.doctor_full_name &&
      row.completed_dose_line_count === other.completed_dose_line_count
    );
  });
}

function asDetail(data: unknown): PrescriptionDetailResponse | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const pxRaw = o.prescription;
  const linesRaw = o.lines ?? o.prescription_drugs ?? o.drugs;
  if (!pxRaw || typeof pxRaw !== "object" || !Array.isArray(linesRaw)) return null;
  const prescription = mapPrescriptionRow(pxRaw as InvBackendSerializerPrescriptionJSON);
  const lines = linesRaw.map((row) => {
    const r = row as Record<string, unknown>;
    const drugRaw = (r.drug ?? {}) as InvBackendSerializerDrugJSON;
    return {
      prescription_id: Number(r.prescription_id ?? prescription.prescription_id),
      drug_id: Number(r.drug_id ?? 0),
      height_cm: Number(r.height_cm ?? 0),
      weight_kg: Number(r.weight_kg ?? 0),
      dose:
        r.dose === null || r.dose === undefined
          ? null
          : Number(r.dose),
      drug: mapDrug(drugRaw),
    };
  });
  return { prescription, lines };
}

function todayDateISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultListFilters() {
  const today = todayDateISO();
  return { fromDate: today, toDate: today, status: "" };
}

interface PrescriptionState {
  cart: PrescriptionCartJSON | null;
  cartLoading: boolean;
  detail: PrescriptionDetailResponse | null;
  detailLoading: boolean;
  detailError: string | null;
  list: PrescriptionJSON[];
  listLoading: boolean;
  listError: string | null;
  filters: ReturnType<typeof defaultListFilters>;
  itemMutationLoading: Record<string, boolean>;
  applicationMutationLoading: boolean;
}

function buildInitialState(): PrescriptionState {
  return {
    cart: null,
    cartLoading: false,
    detail: null,
    detailLoading: false,
    detailError: null,
    list: [],
    listLoading: false,
    listError: null,
    filters: defaultListFilters(),
    itemMutationLoading: {},
    applicationMutationLoading: false,
  };
}

type CartSliceUser = { user: { isAuthenticated: boolean } };

function emptyGuestCartPayload(): PrescriptionCartJSON {
  return {
    has_draft: false,
    drugs_count: 0,
  };
}

function axiosStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { status?: number } }).response;
    return r?.status;
  }
  return undefined;
}

export const fetchPrescriptionCart = createAsyncThunk(
  "prescription/fetchCart",
  async (_, { rejectWithValue, getState }) => {
    const before = getState() as CartSliceUser;
    if (!before.user.isAuthenticated) {
      return emptyGuestCartPayload();
    }
    try {
      const r = await api.prescription.prescriptionCart();
      const after = getState() as CartSliceUser;
      if (!after.user.isAuthenticated) {
        return emptyGuestCartPayload();
      }
      const d = (r.data ?? {}) as Record<string, unknown>;
      return {
        has_draft: Boolean(d.has_draft),
        drugs_count: Number(d.drugs_count ?? 0),
        id: typeof d.id === "number" ? d.id : undefined,
      };
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const fetchPrescriptionDetail = createAsyncThunk(
  "prescription/fetchDetail",
  async (prescriptionId: number, { rejectWithValue }) => {
    try {
      const r = await api.prescription.prescriptionDetail(prescriptionId);
      const detail = asDetail(r.data);
      if (!detail) return rejectWithValue("Неверный ответ сервера");
      return detail;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const addDrugToPrescription = createAsyncThunk(
  "prescription/addDrugLine",
  async (drugId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.prescriptionDrugLink.addDrugToPrescriptionDraft(drugId);
      await dispatch(fetchPrescriptionCart());
      return drugId;
    } catch (e) {
      if (axiosStatus(e) === 409) {
        await dispatch(fetchPrescriptionCart());
        return drugId;
      }
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updatePrescriptionDrugLine = createAsyncThunk(
  "prescription/updateDrugLine",
  async (
    {
      drugId,
      prescriptionId,
      body,
    }: {
      drugId: number;
      prescriptionId: number;
      body: InvBackendSerializerPrescriptionDrugJSON;
    },
    { rejectWithValue, dispatch },
  ) => {
    const key = `${drugId}-${prescriptionId}`;
    try {
      await api.prescriptionDrugLink.updatePrescriptionDrugLine(drugId, prescriptionId, body);
      await dispatch(fetchPrescriptionDetail(prescriptionId));
      return key;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const removePrescriptionDrugLine = createAsyncThunk(
  "prescription/removeDrugLine",
  async (
    { drugId, prescriptionId }: { drugId: number; prescriptionId: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.prescriptionDrugLink.removePrescriptionDrugLine(drugId, prescriptionId);
      await dispatch(fetchPrescriptionDetail(prescriptionId));
      await dispatch(fetchPrescriptionCart());
      return drugId;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updatePrescriptionDraft = createAsyncThunk(
  "prescription/updateDraft",
  async (
    {
      prescriptionId,
      doctorFullName,
    }: { prescriptionId: number; doctorFullName: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.prescription.editPrescriptionDraft(prescriptionId, {
        doctor_full_name: doctorFullName,
      });
      await dispatch(fetchPrescriptionDetail(prescriptionId));
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const formPrescription = createAsyncThunk(
  "prescription/form",
  async (prescriptionId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.prescription.formPrescription(prescriptionId);
      await dispatch(fetchPrescriptionDetail(prescriptionId));
      await dispatch(fetchPrescriptionCart());
      await dispatch(fetchPrescriptionsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const deletePrescription = createAsyncThunk(
  "prescription/delete",
  async (prescriptionId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.prescription.deletePrescription(prescriptionId);
      await dispatch(fetchPrescriptionCart());
      await dispatch(fetchPrescriptionsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const finishPrescription = createAsyncThunk(
  "prescription/finish",
  async (
    { prescriptionId, status }: { prescriptionId: number; status: "completed" | "rejected" },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.prescription.finishPrescription(prescriptionId, { status });
      await dispatch(fetchPrescriptionsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export type FetchPrescriptionsListArg = { background?: boolean };

export const fetchPrescriptionsList = createAsyncThunk<
  PrescriptionJSON[],
  FetchPrescriptionsListArg | undefined,
  { rejectValue: string }
>(
  "prescription/fetchList",
  async (_arg, { getState, rejectWithValue }) => {
    try {
      const st = getState() as {
        prescription: { filters: ReturnType<typeof defaultListFilters> };
      };
      const f = st.prescription.filters;
      const query: { "from-date"?: string; "to-date"?: string; status?: string } = {};
      if (f.fromDate) query["from-date"] = f.fromDate;
      if (f.toDate) query["to-date"] = f.toDate;
      if (f.status) query.status = f.status;
      const r = await api.prescription.listPrescriptions(query);
      return (r.data ?? []).map(mapPrescriptionRow);
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

const prescriptionSlice = createSlice({
  name: "prescription",
  initialState: buildInitialState(),
  reducers: {
    clearPrescriptionDetailError: (state) => {
      state.detailError = null;
    },
    setListFilters: (
      state,
      action: PayloadAction<Partial<ReturnType<typeof defaultListFilters>>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetListFilters: (state) => {
      state.filters = defaultListFilters();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(resetUserSession, () => buildInitialState())
      .addCase(fetchPrescriptionCart.pending, (state) => {
        state.cartLoading = true;
      })
      .addCase(fetchPrescriptionCart.fulfilled, (state, action) => {
        state.cartLoading = false;
        if (
          typeof action.payload === "object" &&
          action.payload &&
          "drugs_count" in action.payload
        ) {
          state.cart = action.payload as PrescriptionCartJSON;
        }
      })
      .addCase(fetchPrescriptionCart.rejected, (state) => {
        state.cartLoading = false;
        state.cart = {
          has_draft: false,
          drugs_count: 0,
        };
      })
      .addCase(fetchPrescriptionDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.detail = null;
      })
      .addCase(fetchPrescriptionDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchPrescriptionDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(fetchPrescriptionsList.pending, (state, action) => {
        if (!action.meta.arg?.background) {
          state.listLoading = true;
        }
        state.listError = null;
      })
      .addCase(fetchPrescriptionsList.fulfilled, (state, action) => {
        state.listLoading = false;
        if (!prescriptionListsEqual(state.list, action.payload)) {
          state.list = action.payload;
        }
      })
      .addCase(fetchPrescriptionsList.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })
      .addCase(addDrugToPrescription.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(addDrugToPrescription.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(addDrugToPrescription.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updatePrescriptionDraft.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(updatePrescriptionDraft.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updatePrescriptionDraft.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(formPrescription.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(formPrescription.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(formPrescription.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(deletePrescription.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(deletePrescription.fulfilled, (state) => {
        state.applicationMutationLoading = false;
        state.detail = null;
      })
      .addCase(deletePrescription.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updatePrescriptionDrugLine.pending, (state, action) => {
        const k = `${action.meta.arg.drugId}-${action.meta.arg.prescriptionId}`;
        state.itemMutationLoading[`line-${k}`] = true;
      })
      .addCase(updatePrescriptionDrugLine.fulfilled, (state, action) => {
        delete state.itemMutationLoading[`line-${action.payload}`];
      })
      .addCase(updatePrescriptionDrugLine.rejected, (state, action) => {
        const id = action.meta?.arg;
        if (id)
          delete state.itemMutationLoading[`line-${id.drugId}-${id.prescriptionId}`];
      })
      .addCase(removePrescriptionDrugLine.pending, (state, action) => {
        const id = action.meta.arg.drugId;
        state.itemMutationLoading[`rm-${id}`] = true;
      })
      .addCase(removePrescriptionDrugLine.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.itemMutationLoading[`rm-${id}`];
      })
      .addCase(removePrescriptionDrugLine.rejected, (state, action) => {
        const id = action.meta?.arg?.drugId;
        if (id != null) delete state.itemMutationLoading[`rm-${id}`];
      })
      .addCase(finishPrescription.pending, (state, action) => {
        const id = action.meta.arg.prescriptionId;
        state.itemMutationLoading[`finish-${id}`] = true;
      })
      .addCase(finishPrescription.fulfilled, (state, action) => {
        const id = action.meta.arg.prescriptionId;
        delete state.itemMutationLoading[`finish-${id}`];
      })
      .addCase(finishPrescription.rejected, (state, action) => {
        const id = action.meta?.arg?.prescriptionId;
        if (id != null) delete state.itemMutationLoading[`finish-${id}`];
      });
  },
});

export const {
  clearPrescriptionDetailError,
  setListFilters,
  resetListFilters,
} = prescriptionSlice.actions;
export default prescriptionSlice.reducer;
