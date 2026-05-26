import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { parseIsModeratorFromToken } from "../utils/jwt";

export interface UserState {
  username: string;
  isAuthenticated: boolean;
  isModerator: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  username: "",
  isAuthenticated: false,
  isModerator: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.loading = false;
      }
    },
    /** После успешного authLoginRequest / authRegisterRequest + login (только axios, без thunk). */
    setUserSession: (state, action: PayloadAction<{ login: string }>) => {
      state.loading = false;
      state.error = null;
      state.isAuthenticated = true;
      state.username = action.payload.login;
      const token = localStorage.getItem("token") ?? "";
      state.isModerator = parseIsModeratorFromToken(token);
    },
    /** После выхода: сброс UI-сессии (запрос logout — axios в вызывающем коде). */
    resetUserSession: () => ({ ...initialState }),
  },
});

export const { clearUserError, setAuthLoading, setAuthError, setUserSession, resetUserSession } =
  userSlice.actions;
export default userSlice.reducer;
