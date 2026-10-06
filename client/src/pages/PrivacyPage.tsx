import { Link } from "react-router";
import styles from "./PageContent.module.css";

export default function PrivacyPage() {
  return (
    <article className={styles["page-content"]}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Privacy</p>
        <h1>Privacy</h1>
        <p className={styles.lead}>
          Files are used only for the conversion you request. The app does not
          require an account or keep a personal conversion history.
        </p>
      </header>

      <section className={styles.card} aria-labelledby="privacy-processing">
        <h2 id="privacy-processing">What is processed</h2>

        <p>
          The server receives the uploaded file and the settings chosen for its
          conversion, such as page size, orientation, or image quality. To
          convert DOCX, XLSX, and PPTX files to PDF, the application uses
          LibreOffice on the server.
        </p>
      </section>

      <section className={styles.card} aria-labelledby="privacy-storage">
        <h2 id="privacy-storage">How long files are kept</h2>

        <ul>
          <li>Uploaded source files are deleted when the request ends.</li>
          <li>
            XLSX conversion can create a temporary workbook. It is deleted when
            processing ends.
          </li>
          <li>
            Generated files remain available temporarily for download. The next
            upload removes results older than 30 minutes.
          </li>
          <li>
            The temporary upload and output folders are cleared when the server
            stops normally.
          </li>
        </ul>
      </section>

      <section
        className={`${styles.card} ${styles.notice}`}
        aria-labelledby="privacy-sensitive-files"
      >
        <h2 id="privacy-sensitive-files">Sensitive files</h2>

        <p>
          Only upload files you are allowed to process. If a document is
          sensitive, run the application and server on your own computer.
        </p>
      </section>

      <Link to="/" className={styles["secondary-link"]}>
        Back to converter
      </Link>
    </article>
  );
}
