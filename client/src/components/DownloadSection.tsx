import { useState } from "react";
import type {
  ConvertedResult,
  ConvertedResults,
} from "../types/conversionResult";
import FilePreview from "./FilePreview";
import { createPreviewData } from "../utils/previewMapper";

interface DownloadSectionProps {
  convertedResults: ConvertedResults;
  onDownload: (result: ConvertedResult) => void;
  onDownloadAll: () => void;
  isPreparingArchive: boolean;
}

export default function DownloadSection({
  convertedResults,
  onDownload,
  onDownloadAll,
  isPreparingArchive,
}: DownloadSectionProps) {
  const [activeResultUrl, setActiveResultUrl] = useState(
    convertedResults[0].url,
  );

  const activeResult =
    convertedResults.find((result) => result.url === activeResultUrl) ??
    convertedResults[0];

  const previewData = createPreviewData(
    activeResult.file,
    activeResult.url,
    false,
  );

  return (
    <div className="download-section">
      <h2>Download Converted File</h2>
      <div aria-label="Converted files">
        {convertedResults.map((result, index) => (
          <button
            key={result.url}
            type="button"
            aria-pressed={result.url === activeResult.url}
            onClick={() => setActiveResultUrl(result.url)}
          >
            Page {index + 1}
          </button>
        ))}
      </div>
      {previewData && <FilePreview preview={previewData} />}
      <button onClick={() => onDownload(activeResult)} className="download-btn">
        Download File
      </button>
      {convertedResults.length > 1 && (
        <button
          type="button"
          onClick={onDownloadAll}
          disabled={isPreparingArchive}
        >
          {isPreparingArchive ? "Preparing archive..." : "Download all"}
        </button>
      )}
    </div>
  );
}
