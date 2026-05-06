import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../routePaths";
import { getPrescriptionCart } from "../../modules/drugsApi";
import type { PrescriptionCartResponse } from "../../modules/types";

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
  const [cart, setCart] = useState<PrescriptionCartResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getPrescriptionCart();
      if (cancelled) return;
      setCart(result);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasActiveDraft =
    Boolean(cart?.has_draft) && typeof cart?.id === "number" && cart.id > 0;

  if (hasActiveDraft && cart) {
    const to = ROUTES.PRESCRIPTION_DRAFT.replace(":prescriptionId", String(cart.id));
    const count = cart.drugs_count ?? 0;
    return (
      <Link
        to={to}
        className="prescription-icon"
        title="Текущий рецепт (черновик)"
        aria-label={`Рецепт, препаратов: ${count}`}
      >
        <PrescriptionGlyph />
        <span className="prescription-icon__badge">{count}</span>
      </Link>
    );
  }

  return (
    <div
      className="prescription-icon prescription-icon--inactive"
      title="Нет активного черновика рецепта"
      aria-hidden
    >
      <PrescriptionGlyph />
      <span className="prescription-icon__badge prescription-icon__badge--empty">0</span>
    </div>
  );
}
