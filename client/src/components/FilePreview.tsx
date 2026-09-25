import { useState, useEffect, useRef } from "react";
import { readFileAsText } from "../utils/fileUtils";
import { parseCsvFile, type CsvRow } from "../utils/csv";
import "../styles/FileConverter.css";
import type { PreviewData } from "../types/preview";
import { parseXlsxFile, type XlsxSheet } from "../utils/xlsx";
import { renderAsync } from "docx-preview";

type FilePreviewProps = {
  preview: PreviewData;
};

function ImagePreview({ url }: { url: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <p className="error-message">Failed to load image preview</p>;
  }

  return (
    <img
      src={url}
      alt="Preview"
      onError={() => setHasError(true)}
      className="preview-image"
    />
  );
}

function PDFPreview({ url }: { url: string }) {
  return <iframe src={url} title="PDF Preview" className="pdf-preview" />;
}

function TextPreview({ file, isLoading }: { file: File; isLoading: boolean }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      readFileAsText(file)
        .then(setText)
        .catch(() => setError("Failed to load file content"));
    }
  }, [file, isLoading]);

  if (isLoading)
    return <p className="loading-message">Loading text content...</p>;
  if (error) return <p className="error-message">{error}</p>;
  return <textarea readOnly value={text} className="text-preview" />;
}

function WordPreview({ file, isLoading }: { file: File; isLoading: boolean }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (isLoading || !previewRef.current) {
      return;
    }

    const container = previewRef.current;
    let active = true;

    setIsRendering(true);
    setError(null);

    renderAsync(file, container)
      .catch(() => {
        if (active) setError("Failed to render DOCX content");
      })
      .finally(() => {
        if (active) {
          setIsRendering(false);
        }
      });

    return () => {
      active = false;
    };
  }, [file, isLoading]);

  return (
    <div className="word-preview" aria-busy={isLoading || isRendering}>
      {isLoading || isRendering ? <p>Loading DOCX content...</p> : null}

      {error ? (
        <p className="error-message" role="alert">
          {error}
        </p>
      ) : null}
      <div ref={previewRef} data-testid="docx-preview" />
    </div>
  );
}

function CsvPreview({ file, isLoading }: { file: File; isLoading: boolean }) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(true);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setIsParsing(true);

    parseCsvFile(file)
      .then((parsedRows) => {
        setRows(parsedRows);
      })
      .catch(() => {
        setError("Failed to load CSV content");
      })
      .finally(() => {
        setIsParsing(false);
      });
  }, [file, isLoading]);

  if (isLoading || isParsing) {
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

function XlsxPreview({ file, isLoading }: { file: File; isLoading: boolean }) {
  const [sheets, setSheets] = useState<XlsxSheet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(true);
  const [selectedSheetName, setSelectedSheetName] = useState("");

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let active = true;

    setIsParsing(true);
    setError(null);

    parseXlsxFile(file)
      .then((parsedSheets) => {
        if (!active) return;
        setSheets(parsedSheets);
        setSelectedSheetName(parsedSheets[0]?.name ?? "");
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
  }, [file, isLoading]);

  if (isLoading || isParsing) {
    return <p>Loading XLSX content...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  const selectedSheet = sheets.find(
    (sheet) => sheet.name === selectedSheetName,
  );
  const previewRows = selectedSheet?.rows.slice(0, 100) ?? [];
  const columnCount = selectedSheet?.rows[0]?.length ?? 0;

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
              aria-pressed={sheet.name === selectedSheetName}
              onClick={() => setSelectedSheetName(sheet.name)}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      </div>
      {selectedSheet && (
        <section className="xlsx-table-scroll">
          {selectedSheet.rows.length === 0 ? (
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
        </section>
      )}
      {selectedSheet && selectedSheet.rows.length > previewRows.length && (
        <p>
          Showing first {previewRows.length} of {selectedSheet.rows.length}{" "}
          rows.
        </p>
      )}
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

function UnsupportedPreview({ fileType }: { fileType: string }) {
  return (
    <div className="unsupported-preview">
      <p>Preview not available for this file type</p>
      <p>Type: {fileType || "unknown"}</p>
    </div>
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled preview variant: ${JSON.stringify(value)}`);
}

export default function FilePreview({ preview }: FilePreviewProps) {
  switch (preview.kind) {
    case "image":
      return <ImagePreview url={preview.url} />;

    case "pdf":
      return <PDFPreview url={preview.url} />;

    case "text":
      return <TextPreview file={preview.file} isLoading={preview.isLoading} />;

    case "word":
      return <WordPreview file={preview.file} isLoading={preview.isLoading} />;

    case "csv":
      return <CsvPreview file={preview.file} isLoading={preview.isLoading} />;

    case "xlsx":
      return <XlsxPreview file={preview.file} isLoading={preview.isLoading} />;

    case "unsupported":
      return <UnsupportedPreview fileType={preview.fileType} />;

    default:
      return assertNever(preview);
  }
}
