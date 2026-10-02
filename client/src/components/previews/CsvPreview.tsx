import { useState, useEffect } from "react";
import { parseCsvFile, type CsvRow } from "../../utils/csv";

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
      <p className="loading-message" role="status" aria-live="polite">
        Loading CSV content
        <span className="loading-dots" aria-hidden="true" />
      </p>
    );
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (rows.length === 0) {
    return <p className="error-message">CSV file is empty</p>;
  }

  const previewRows = rows.slice(0, 100);
  const headers = Object.keys(rows[0]);
  return (
    <div className="csv-preview-container">
      <table className="csv-preview-table">
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
