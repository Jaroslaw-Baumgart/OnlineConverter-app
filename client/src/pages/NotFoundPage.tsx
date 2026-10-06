import { Link } from "react-router";
import styles from "./PageContent.module.css";

export default function NotFoundPage() {
  return (
    <article className={styles["page-content"]}>
      <h1>Page Not Found</h1>
      <Link to="/">Back to converter</Link>
    </article>
  );
}
