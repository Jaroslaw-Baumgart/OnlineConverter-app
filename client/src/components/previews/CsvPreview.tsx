import { useState, useEffect } from "react";
import { parseCsvFile, type CsvRow } from "../../utils/csv";
import styles from "./CsvPreview.module.css";
import stateStyles from "../PreviewState.module.css";

export function CsvPreview({ file }: { file: File }) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(true);

  useEffect(() => {
    let active = true;
    setIsParsing(true);
    setError(null);
    setRows([]);

    parseCsvFile(file)
      .then((parsedRows) => {
        if (active) {
          setRows(parsedRows);
        }
      })
      .catch(() => {
        if (active) {
          setError("Failed to load CSV content");
        }
      })
      .finally(() => {
        if (active) {
          setIsParsing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [file]);

  if (isParsing) {
    return (
      <p className={stateStyles["loading-message"]} role="status" aria-live="polite">
        Loading CSV content
        <span className={stateStyles["loading-dots"]} aria-hidden="true" />
      </p>
    );
  }

  if (error) {
    return <p className={stateStyles["error-message"]}>{error}</p>;
  }

  if (rows.length === 0) {
    return <p className={stateStyles["error-message"]}>CSV file is empty</p>;
  }

  const previewRows = rows.slice(0, 100);
  const headers = Object.keys(rows[0]);
  return (
    <div className={styles["csv-preview-container"]} data-preview-kind="csv">
      <table className={styles["csv-preview-table"]}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {previewRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header) => (
                <td key={header} title={row[header]}>
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > previewRows.length && (
        <p>
          Showing first {previewRows.length} of {rows.length} rows.
        </p>
      )}
    </div>
  );
}
