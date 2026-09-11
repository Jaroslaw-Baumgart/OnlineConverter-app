import { NavLink, Outlet } from "react-router";
import "../App.css";

export default function AppLayout() {
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
        <Outlet />
      </main>
    </div>
  );
}
