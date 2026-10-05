import { NavLink, Outlet, useLocation } from "react-router";
import "../App.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { Suspense } from "react";
import ConverterLogo from "../components/ConverterLogo";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-container">
      <nav aria-label="Main navigation" className="app-nav">
        <NavLink to="/" className="brand-link">
          <ConverterLogo />
          <span>Converter</span>
        </NavLink>

        <div className="nav-links">
          <NavLink to="/about" className="nav-link">
            About
          </NavLink>
          <NavLink to="/privacy" className="nav-link">
            Privacy
          </NavLink>
        </div>
      </nav>
      <main>
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<p role="status">Loading page...</p>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
