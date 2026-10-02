import { parseXlsxFile, type XlsxSheet } from "../../utils/xlsx";
import { useState, useEffect } from "react";

function XlsxSheetPreview({
  sheet,
  showName,
}: {
  sheet: XlsxSheet;
  showName: boolean;
}) {
  const previewRows = sheet.rows.slice(0, 100);
  const columnCount = sheet.rows[0]?.length ?? 0;

  return (
    <section>
      {showName && <h3>{sheet.name}</h3>}

      <div className="xlsx-table-scroll">
        {sheet.rows.length === 0 ? (
          <p>This sheet is empty.</p>
        ) : (
          <table className="csv-preview-table xlsx-preview-table">
            <thead>
              <tr>
                {Array.from({ length: columnCount }, (_, columnIndex) => (
                  <th key={columnIndex} scope="col">
                    {getColumnLabel(columnIndex)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: columnCount }, (_, columnIndex) => (
                    <td key={columnIndex}>{row[columnIndex] ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sheet.rows.length > previewRows.length && (
        <p>
          Showing first {previewRows.length} of {sheet.rows.length} rows.
        </p>
      )}
    </section>
  );
}

export function XlsxPreview({
  file,
  onXlsxSheetChange,
}: {
  file: File;
  onXlsxSheetChange?: (sheetName: string | undefined) => void;
}) {
  const [sheets, setSheets] = useState<XlsxSheet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(true);
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [isAllSheetsSelected, setIsAllSheetsSelected] = useState(false);

  useEffect(() => {
    let active = true;

    setIsParsing(true);
    setError(null);

    parseXlsxFile(file)
      .then((parsedSheets) => {
        if (!active) return;
        const initialSheetName = parsedSheets[0]?.name ?? "";

        setSheets(parsedSheets);
        setSelectedSheetName(initialSheetName);
        setIsAllSheetsSelected(false);
        onXlsxSheetChange?.(initialSheetName);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load XLSX content");
      })
      .finally(() => {
        if (!active) return;
        setIsParsing(false);
      });

    return () => {
      active = false;
    };
  }, [file, onXlsxSheetChange]);

  if (isParsing) {
    return <p>Loading XLSX content...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  const selectedSheet = sheets.find(
    (sheet) => sheet.name === selectedSheetName,
  );

  const previewSheets = isAllSheetsSelected
    ? sheets
    : selectedSheet
      ? [selectedSheet]
      : [];

  return (
    <div className="xlsx-preview">
      <div className="xlsx-sheet-picker">
        <span className="xlsx-sheet-label">Sheet</span>
        <div className="xlsx-sheet-buttons" role="group" aria-label="Sheets">
          {sheets.map((sheet) => (
            <button
              key={sheet.name}
              type="button"
              className="xlsx-sheet-button"
              value={sheet.name}
              aria-pressed={
                !isAllSheetsSelected && sheet.name === selectedSheetName
              }
              onClick={() => {
                setIsAllSheetsSelected(false);
                setSelectedSheetName(sheet.name);
                onXlsxSheetChange?.(sheet.name);
              }}
            >
              {sheet.name}
            </button>
          ))}
          <button
            type="button"
            className="xlsx-sheet-button xlsx-all-sheet-button"
            aria-pressed={isAllSheetsSelected}
            onClick={() => {
              setIsAllSheetsSelected(true);
              onXlsxSheetChange?.(undefined);
            }}
          >
            All sheets
          </button>
        </div>
      </div>
      {!isAllSheetsSelected && (
        <p className="xlsx-dependency-notice" role="note">
          If this sheet depends on formulas or charts from other sheets, choose
          All sheets.
        </p>
      )}
      {previewSheets.map((sheet) => (
        <XlsxSheetPreview
          key={sheet.name}
          sheet={sheet}
          showName={isAllSheetsSelected}
        />
      ))}
      <p className="xlsx-chart-notice" role="note">
        Charts are not shown in this preview. To view them, convert the file to
        PDF using the charts option.
      </p>
    </div>
  );
}

function getColumnLabel(index: number): string {
  let label = "";

  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    label = String.fromCharCode(((value - 1) % 26) + 65) + label;
  }

  return label;
}
