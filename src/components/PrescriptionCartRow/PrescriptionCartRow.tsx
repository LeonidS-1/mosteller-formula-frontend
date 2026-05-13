import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchPrescriptionCart } from "../../store/slices/prescriptionSlice";
import "./PrescriptionCartRow.css";

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

export default function PrescriptionCartRow({ className = "" }: { className?: string }) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.prescription.cart);
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);

  useEffect(() => {
    void dispatch(fetchPrescriptionCart());
  }, [dispatch, isAuthenticated]);

  const count = cart?.drugs_count ?? 0;
  const hasDraft = Boolean(cart?.has_draft && count > 0 && cart?.id != null);

  const inner = (
    <>
      <PrescriptionGlyph />
      <span className="prescription-cart-row__badge">{count}</span>
    </>
  );

  const rootClass = ["prescription-cart-row", className].filter(Boolean).join(" ");

  if (hasDraft && cart?.id != null) {
    return (
      <Link
        to={`/prescriptions/${cart.id}`}
        className={`${rootClass} prescription-cart-row--active`}
        title="Текущий рецепт (черновик)"
        aria-label={`Рецепт, препаратов: ${count}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={`${rootClass} prescription-cart-row--inactive`}
      title={
        isAuthenticated
          ? "Нет активного черновика рецепта"
          : "Войдите, чтобы оформить рецепт"
      }
      aria-hidden
    >
      <PrescriptionGlyph />
      <span className="prescription-cart-row__badge prescription-cart-row__badge--empty">0</span>
    </div>
  );
}
