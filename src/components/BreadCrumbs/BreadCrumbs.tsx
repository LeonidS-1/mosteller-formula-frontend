import { Link, matchPath, useLocation } from "react-router-dom";
import { getMockDrugById } from "../../modules/drugsCatalogMock";
import { ROUTES } from "../../routePaths";

type Crumb = { label: string; to?: string };

export interface BreadCrumbsProps {
  /** Доп. класс, например `app-breadcrumbs--toolbar` для вложения в `.toolbar`. */
  className?: string;
}

export default function BreadCrumbs({ className }: BreadCrumbsProps) {
  const { pathname } = useLocation();

  const crumbs: Crumb[] = (() => {
    if (pathname === "/" || pathname === "") {
      return [{ label: "Главная" }];
    }

    const drugMatch = matchPath(ROUTES.DRUG_DETAIL, pathname);
    if (drugMatch?.params.drugId) {
      const id = Number(drugMatch.params.drugId);
      const d = getMockDrugById(id);
      const title = d?.title ?? `Препарат ${drugMatch.params.drugId}`;
      return [{ label: "Главная", to: ROUTES.DRUG_CATALOG }, { label: title }];
    }

    const rxMatch = matchPath(ROUTES.PRESCRIPTION_DRAFT, pathname);
    if (rxMatch?.params.prescriptionId) {
      return [
        { label: "Главная", to: ROUTES.DRUG_CATALOG },
        { label: `Рецепт №${rxMatch.params.prescriptionId}` },
      ];
    }

    return [{ label: "Главная", to: ROUTES.DRUG_CATALOG }, { label: "Страница" }];
  })();

  const navClass = ["app-breadcrumbs", className].filter(Boolean).join(" ");

  return (
    <nav className={navClass} aria-label="Навигационная цепочка">
      <ol className="app-breadcrumbs__list">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="app-breadcrumbs__item">
              {crumb.to != null && !last ? (
                <Link to={crumb.to} className="app-breadcrumbs__link">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={last ? "app-breadcrumbs__current" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
