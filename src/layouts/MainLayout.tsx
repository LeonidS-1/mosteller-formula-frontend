import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "../components/AppHeader/AppHeader";
import BreadCrumbs from "../components/BreadCrumbs/BreadCrumbs";
import { ROUTES } from "../routePaths";

export default function MainLayout() {
  const { pathname } = useLocation();
  const isDrugCatalog = pathname === ROUTES.DRUG_CATALOG || pathname === "";

  return (
    <div className="main-layout">
      <AppHeader />
      {!isDrugCatalog ? (
        <div className="toolbar toolbar--page-nav">
          <div className="toolbar__breadcrumbs">
            <BreadCrumbs className="app-breadcrumbs--toolbar" />
          </div>
        </div>
      ) : null}
      <Outlet />
    </div>
  );
}
