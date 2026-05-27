import { configureStore } from "@reduxjs/toolkit";
import drugCatalogReducer from "./slices/drugCatalogSlice";
import userReducer from "./slices/userSlice";
import prescriptionReducer from "./slices/prescriptionSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    prescription: prescriptionReducer,
    drugCatalog: drugCatalogReducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
