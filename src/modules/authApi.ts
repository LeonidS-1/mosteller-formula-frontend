import axios from "axios";
import { TARGET_CONFIG } from "../target_config";

const baseURL = TARGET_CONFIG.apiBaseUrl;

/** Axios для /users/* без codegen (по заданию: для auth только axios). */
export const authAxios = axios.create({
  baseURL,
});

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authAxios.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === "object" && "token" in data && data.token) {
      localStorage.setItem("token", String(data.token));
    }
    return response;
  },
  (error) => Promise.reject(error),
);

export interface SignInRequest {
  login: string;
  password: string;
}

export interface SignUpRequest {
  login: string;
  password: string;
}

export interface SignUpResponse {
  login?: string;
  is_moderator?: boolean;
}

export async function authLoginRequest(credentials: SignInRequest) {
  return authAxios.post<{ token?: string }>("/users/login", credentials);
}

export async function authRegisterRequest(user: SignUpRequest) {
  return authAxios.post<SignUpResponse>("/users/register", user);
}

export async function authLogoutRequest() {
  return authAxios.post("/users/logout", null, { validateStatus: (s) => s === 204 || s < 300 });
}
