import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutUser } from "../../store/slices/userSlice";
import { ROUTES } from "../../routePaths";
import "./AppHeader.css";

export default function AppHeader() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, username } = useAppSelector((s) => s.user);
  const cart = useAppSelector((s) => s.prescription.cart);

  const handleLogout = () => {
    void dispatch(logoutUser());
  };

  const draftActive =
    Boolean(cart?.has_draft && cart.drugs_count > 0 && cart.id != null);

  return (
    <header>
      <Navbar
        expand="lg"
        collapseOnSelect
        className="inv-navbar py-0"
      >
        <Container fluid className="inv-navbar__inner">
          <Navbar.Brand as={Link} to={ROUTES.DRUG_CATALOG} className="header-home mb-0 py-2">
            <img
              src="/static/img/logo.svg"
              alt="Расчёт детской дозы по ППТ"
              className="header-home__icon"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="inv-main-nav" className="inv-navbar__toggle" />
          <Navbar.Collapse id="inv-main-nav">
            <Nav className="ms-auto mb-2 mb-lg-0 inv-navbar__nav" navbar>
              <Nav.Link as={Link} to={ROUTES.DRUG_CATALOG} className="inv-nav-link" eventKey="catalog">
                Каталог препаратов
              </Nav.Link>
              {isAuthenticated ? (
                <Nav.Link
                  as={Link}
                  to={ROUTES.PRESCRIPTIONS}
                  className="inv-nav-link"
                  eventKey="prescriptions"
                >
                  Рецепты
                </Nav.Link>
              ) : null}
              {draftActive && cart?.id != null ? (
                <Nav.Link
                  as={Link}
                  to={`/prescriptions/${cart.id}`}
                  className="inv-nav-link"
                  eventKey="draft"
                >
                  Текущий рецепт
                </Nav.Link>
              ) : (
                <Nav.Link
                  className="inv-nav-link inv-nav-link--muted"
                  eventKey="draft-off"
                  disabled
                >
                  Текущий рецепт
                </Nav.Link>
              )}
              {isAuthenticated ? (
                <Nav.Link
                  as={Link}
                  to={ROUTES.DRUG_CATALOG}
                  className="inv-nav-link inv-nav-link--logout"
                  eventKey="logout"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  <span className="inv-nav-link__username">{username}</span>
                  <span className="inv-nav-link__logout-label">Выход</span>
                </Nav.Link>
              ) : (
                <>
                  <Nav.Link as={Link} to={ROUTES.SIGN_IN} className="inv-nav-link" eventKey="signin">
                    Вход
                  </Nav.Link>
                  <Nav.Link as={Link} to={ROUTES.SIGN_UP} className="inv-nav-link" eventKey="signup">
                    Регистрация
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}
