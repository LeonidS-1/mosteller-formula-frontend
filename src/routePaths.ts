export const ROUTES = {
  DRUG_CATALOG: "/",
  DRUG_DETAIL: "/drugs/:drugId",
  PRESCRIPTIONS: "/prescriptions",
  PRESCRIPTION_DRAFT: "/prescriptions/:prescriptionId",
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
} as const;

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  DRUG_CATALOG: "Каталог препаратов",
  DRUG_DETAIL: "Препарат",
  PRESCRIPTIONS: "Рецепты",
  PRESCRIPTION_DRAFT: "Рецепт",
  SIGN_IN: "Вход",
  SIGN_UP: "Регистрация",
};
