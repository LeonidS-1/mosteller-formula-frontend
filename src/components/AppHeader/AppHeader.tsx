import { Link } from "react-router-dom";
import PrescriptionCartIcon from "../PrescriptionCartIcon/PrescriptionCartIcon";
import { ROUTES } from "../../routePaths";

/** Как `<header>` в [inv/templates/index.html](inv/templates/index.html) + иконка рецепта справа. */
export default function AppHeader() {
  return (
    <header>
      <Link to={ROUTES.DRUG_CATALOG} className="header-home">
        <img src="/static/img/logo.svg" alt="Расчёт дозы по ППТ" className="header-home__icon" />
      </Link>
      <div className="app-header__prescription">
        <PrescriptionCartIcon />
      </div>
    </header>
  );
}
