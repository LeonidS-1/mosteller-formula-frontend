import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DrugCatalogFilterCriteria } from "../../modules/types";

function defaultCatalogFilters(): DrugCatalogFilterCriteria {
  return { title: "" };
}

interface DrugCatalogState {
  filters: DrugCatalogFilterCriteria;
}

const initialState: DrugCatalogState = {
  filters: defaultCatalogFilters(),
};

const drugCatalogSlice = createSlice({
  name: "drugCatalog",
  initialState,
  reducers: {
    setCatalogFilters: (
      state,
      action: PayloadAction<Partial<DrugCatalogFilterCriteria>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetCatalogFilters: (state) => {
      state.filters = defaultCatalogFilters();
    },
  },
});

export const { setCatalogFilters, resetCatalogFilters } = drugCatalogSlice.actions;
export default drugCatalogSlice.reducer;
