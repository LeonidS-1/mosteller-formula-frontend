export const ROUTES = {
  DRUG_CATALOG: "/",
  DRUG_DETAIL: "/drugs/:drugId",
  PRESCRIPTION_DRAFT: "/prescriptions/:prescriptionId",
} as const;

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  DRUG_CATALOG: "Каталог препаратов",
  DRUG_DETAIL: "Препарат",
  PRESCRIPTION_DRAFT: "Рецепт",
};
