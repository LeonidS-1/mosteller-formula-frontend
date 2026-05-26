import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import { authLoginRequest, authRegisterRequest } from "../../modules/authApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchPrescriptionCart } from "../../store/slices/prescriptionSlice";
import {
  setAuthError,
  setAuthLoading,
  setUserSession,
} from "../../store/slices/userSlice";
import { apiErrMessage } from "../../store/utils/apiError";
import { ROUTES } from "../../routePaths";
import "../SignInPage/SignInPage.css";

export default function SignUpPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((s) => s.user);
  const [form, setForm] = useState({ login: "", password: "", password2: "" });

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.DRUG_CATALOG, { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) return;
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));
    try {
      await authRegisterRequest({ login: form.login, password: form.password });
      await authLoginRequest({ login: form.login, password: form.password });
      dispatch(setUserSession({ login: form.login }));
      void dispatch(fetchPrescriptionCart());
      navigate(ROUTES.DRUG_CATALOG, { replace: true });
    } catch (err) {
      dispatch(setAuthError(apiErrMessage(err)));
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  const mismatch = form.password && form.password2 && form.password !== form.password2;

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <h1 className="auth-page__title">Регистрация</h1>
        {error ? <div className="auth-page__error">{error}</div> : null}
        {mismatch ? (
          <div className="auth-page__error">Пароли не совпадают</div>
        ) : null}
        <form onSubmit={handleSubmit} className="auth-page__form">
          <label className="auth-page__label" htmlFor="signup-login">
            Логин
          </label>
          <input
            id="signup-login"
            className="auth-page__input"
            type="text"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            required
            disabled={loading}
            autoComplete="username"
          />
          <label className="auth-page__label" htmlFor="signup-password">
            Пароль
          </label>
          <input
            id="signup-password"
            className="auth-page__input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={loading}
            autoComplete="new-password"
          />
          <label className="auth-page__label" htmlFor="signup-password2">
            Повтор пароля
          </label>
          <input
            id="signup-password2"
            className="auth-page__input"
            type="password"
            value={form.password2}
            onChange={(e) => setForm({ ...form, password2: e.target.value })}
            required
            disabled={loading}
            autoComplete="new-password"
          />
          <button
            type="submit"
            className="auth-page__submit"
            disabled={loading || Boolean(mismatch)}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="auth-page__spinner" /> Создание…
              </>
            ) : (
              "Зарегистрироваться"
            )}
          </button>
        </form>
        <p className="auth-page__footer">
          Уже есть аккаунт? <Link to={ROUTES.SIGN_IN}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
