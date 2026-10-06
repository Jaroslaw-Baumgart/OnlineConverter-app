import { NavLink, Outlet, useLocation } from "react-router";
import styles from "./AppLayout.module.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { Suspense } from "react";
import ConverterLogo from "../components/ConverterLogo";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className={styles["app-container"]}>
      <nav aria-label="Main navigation" className={styles["app-nav"]}>
        <NavLink to="/" className={styles["brand-link"]}>
          <ConverterLogo />
          <span>Converter</span>
        </NavLink>

        <div className={styles["nav-links"]}>
          <NavLink to="/about" className={styles["nav-link"]}>
            About
          </NavLink>
          <NavLink to="/privacy" className={styles["nav-link"]}>
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
