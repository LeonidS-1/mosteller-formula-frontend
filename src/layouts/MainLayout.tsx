import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "../components/AppHeader/AppHeader";
import BreadCrumbs from "../components/BreadCrumbs/BreadCrumbs";
import { useAppDispatch } from "../store/hooks";
import { fetchPrescriptionCart } from "../store/slices/prescriptionSlice";
import { ROUTES } from "../routePaths";

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  useEffect(() => {
    void dispatch(fetchPrescriptionCart());
  }, [dispatch]);

  const isCatalog = pathname === ROUTES.DRUG_CATALOG || pathname === "";

  return (
    <div className="main-layout">
      <AppHeader />
      {!isCatalog ? (
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
