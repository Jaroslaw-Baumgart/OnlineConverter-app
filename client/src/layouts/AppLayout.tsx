import { NavLink, Outlet, useLocation } from "react-router";
import "../App.css";
import ErrorBoundary from "../components/ErrorBoundary";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-container">
      <nav aria-label="Main navigation" className="app-nav">
        <NavLink to="/" className="nav-link">
          Converter
        </NavLink>
        <NavLink to="/about" className="nav-link">
          About
        </NavLink>
        <NavLink to="/privacy" className="nav-link">
          Privacy
        </NavLink>
      </nav>
      <main>
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
