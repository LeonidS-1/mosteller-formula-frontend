import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DrugCatalogPage from "./pages/DrugCatalogPage/DrugCatalogPage";
import DrugDetailPage from "./pages/DrugDetailPage/DrugDetailPage";
import PrescriptionDraftPage from "./pages/PrescriptionDraftPage/PrescriptionDraftPage";
import PrescriptionsPage from "./pages/PrescriptionsPage/PrescriptionsPage";
import SignInPage from "./pages/SignInPage/SignInPage";
import SignUpPage from "./pages/SignUpPage/SignUpPage";
import { ROUTES } from "./routePaths";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index_style.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DRUG_CATALOG} element={<DrugCatalogPage />} />
          <Route path={ROUTES.DRUG_DETAIL} element={<DrugDetailPage />} />
          <Route path={ROUTES.PRESCRIPTIONS} element={<PrescriptionsPage />} />
          <Route path={ROUTES.PRESCRIPTION_DRAFT} element={<PrescriptionDraftPage />} />
          <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
          <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
