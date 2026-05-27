import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DrugCatalogPage from "./pages/DrugCatalogPage/DrugCatalogPage";
import DrugDetailPage from "./pages/DrugDetailPage/DrugDetailPage";
import PrescriptionDraftPage from "./pages/PrescriptionDraftPage/PrescriptionDraftPage";
import { ROUTES } from "./routePaths";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index_style.css";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DRUG_CATALOG} element={<DrugCatalogPage />} />
          <Route path={ROUTES.DRUG_DETAIL} element={<DrugDetailPage />} />
          <Route path={ROUTES.PRESCRIPTION_DRAFT} element={<PrescriptionDraftPage />} />
          <Route path="*" element={<Navigate to={ROUTES.DRUG_CATALOG} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
