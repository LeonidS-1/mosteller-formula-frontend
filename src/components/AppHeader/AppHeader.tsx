import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { ROUTES } from "../../routePaths";
import "./AppHeader.css";

type HeaderNavItemsProps = {
  draftActive: boolean;
  draftId: number | null | undefined;
  onNavigate?: () => void;
};

function HeaderNavItems({
  draftActive,
  draftId,
  onNavigate,
}: HeaderNavItemsProps) {
  const afterNav = () => onNavigate?.();

  return (
    <>
      <Nav.Link as={Link} to={ROUTES.DRUG_CATALOG} className="inv-nav-link" eventKey="catalog" onClick={afterNav}>
        Каталог препаратов
      </Nav.Link>
      {draftActive && draftId != null ? (
        <Nav.Link
          as={Link}
          to={`/prescriptions/${draftId}`}
          className="inv-nav-link"
          eventKey="draft"
          onClick={afterNav}
        >
          Текущий рецепт
        </Nav.Link>
      ) : (
        <Nav.Link className="inv-nav-link inv-nav-link--muted" eventKey="draft-off" disabled>
          Текущий рецепт
        </Nav.Link>
      )}
    </>
  );
}

export default function AppHeader() {
  const draftActive = false;
  const draftId = undefined;

  const innerRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const [navCompact, setNavCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const navItemsProps: HeaderNavItemsProps = {
    draftActive,
    draftId,
    onNavigate: navCompact ? () => setExpanded(false) : undefined,
  };

  const updateLayout = useCallback(() => {
    const inner = innerRef.current;
    const brand = brandRef.current;
    const measure = measureRef.current;
    if (!inner || !brand || !measure) return;

    const gap = 16;
    const needed = brand.getBoundingClientRect().width + measure.getBoundingClientRect().width + gap;
    const available = inner.clientWidth;
    const nextCompact = needed > available + 0.5;

    setNavCompact((prev) => {
      if (nextCompact && !prev) {
        setExpanded(false);
      }
      return nextCompact;
    });
  }, []);

  useLayoutEffect(() => {
    updateLayout();
    const inner = innerRef.current;
    if (!inner) return undefined;

    const ro = new ResizeObserver(() => updateLayout());
    ro.observe(inner);
    return () => ro.disconnect();
  }, [updateLayout, draftActive, draftId]);

  return (
    <header>
      <Navbar
        expand={false}
        collapseOnSelect
        expanded={navCompact ? expanded : true}
        onToggle={navCompact ? setExpanded : undefined}
        className={`inv-navbar py-0 ${navCompact ? "inv-navbar--compact" : "inv-navbar--inline"}`}
      >
        <Container fluid className="inv-navbar__inner" ref={innerRef}>
          <Navbar.Brand
            ref={brandRef}
            as={Link}
            to={ROUTES.DRUG_CATALOG}
            className="header-home mb-0 py-2"
          >
            <img
              src="/static/img/logo.svg"
              alt="Расчёт детской дозы по ППТ"
              className="header-home__icon"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="inv-main-nav" className="inv-navbar__toggle" />
          <Navbar.Collapse id="inv-main-nav">
            <Nav className={`ms-auto inv-navbar__nav ${navCompact ? "mb-2" : "mb-0"}`} navbar>
              <HeaderNavItems {...navItemsProps} />
            </Nav>
          </Navbar.Collapse>
          <div ref={measureRef} className="inv-navbar__nav-measure" aria-hidden="true">
            <Nav className="inv-navbar__nav" navbar>
              <HeaderNavItems {...navItemsProps} />
            </Nav>
          </div>
        </Container>
      </Navbar>
    </header>
  );
}
