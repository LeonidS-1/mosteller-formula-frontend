import { Link } from "react-router-dom";
import { ROUTES } from "../../routePaths";
import { PRESCRIPTION_DEMO_ID, prescriptionDraftLineCount } from "../../modules/prescriptionDraftMock";

/** Как блок `prescription-icon` в [inv/templates/index.html](inv/templates/index.html). */
function PrescriptionGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <circle cx="9" cy="8" r="2.5" />
      <path d="M5 15c0-2 2-3 4-3s4 1 4 3" />
      <line x1="15" y1="7" x2="19" y2="7" />
      <line x1="15" y1="11" x2="18" y2="11" />
      <line x1="15" y1="15" x2="17" y2="15" />
    </svg>
  );
}

export default function PrescriptionCartIcon() {
  const to = ROUTES.PRESCRIPTION_DRAFT.replace(":prescriptionId", String(PRESCRIPTION_DEMO_ID));
  const count = prescriptionDraftLineCount();

  if (count > 0) {
    return (
      <Link to={to} className="prescription-icon" title="Текущий рецепт (черновик)" aria-label={`Рецепт, строк: ${count}`}>
        <PrescriptionGlyph />
        <span className="prescription-icon__badge">{count}</span>
      </Link>
    );
  }

  return (
    <div className="prescription-icon prescription-icon--inactive" title="Нет активного черновика рецепта" aria-hidden>
      <PrescriptionGlyph />
      <span className="prescription-icon__badge prescription-icon__badge--empty">0</span>
    </div>
  );
}
