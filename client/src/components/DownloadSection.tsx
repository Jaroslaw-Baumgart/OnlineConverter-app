import { useState } from "react";
import type {
  ConvertedResult,
  ConvertedResults,
} from "../types/conversionResult";
import FilePreview from "./FilePreview";
import { createPreviewData } from "../utils/previewMapper";
import styles from "./DownloadSection.module.css";
import panelStyles from "./ConverterPanel.module.css";
import primaryActionStyles from "./PrimaryAction.module.css";
import { CheckIcon, DownloadIcon, FileIcon } from "./UiIcons";

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

  const previewData = createPreviewData(activeResult.file, activeResult.url);
  const targetFormat = activeResult.file.name.split(".").pop()?.toUpperCase();

  return (
    <div className={`${panelStyles.panel} ${styles["download-section"]}`}>
      <div className={styles["download-header"]}>
        <div className={styles["download-title"]}>
          <span className={styles["success-icon"]}>
            <CheckIcon />
          </span>
          <div>
            <h2 className={panelStyles.heading}>Converted file</h2>
            <p className={styles["success-message"]}>Conversion complete</p>
          </div>
        </div>

        <div className={styles["download-actions"]}>
          <button
            type="button"
            className={`${primaryActionStyles.button} ${styles["download-btn"]}`}
            onClick={() => onDownload(activeResult)}
          >
            <DownloadIcon className={primaryActionStyles.icon} />
            Download file
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
      </div>
      <div className={styles["result-details"]}>
        <FileIcon className={styles["result-file-icon"]} />
        <span className={styles["result-file-name"]}>{activeResult.file.name}</span>
        {targetFormat ? <span className={styles["format-badge"]}>{targetFormat}</span> : null}
      </div>
      {convertedResults.length > 1 && (
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
      )}
      {previewData && <FilePreview preview={previewData} />}
    </div>
  );
}
