import FilePreview from "./FilePreview";
import { createPreviewData } from "../utils/previewMapper";

interface DownloadSectionProps {
  convertedFile: string | null;
  convertedPreviewFile: File | null;
  onDownload: () => void;
}

export default function DownloadSection({
  convertedFile,
  convertedPreviewFile,
  onDownload,
}: DownloadSectionProps) {
  const previewData =
    convertedFile && convertedPreviewFile
      ? createPreviewData(convertedPreviewFile, convertedFile, false)
      : null;

  return (
    <div className="download-section">
      <h2>Download Converted File</h2>
      {previewData && <FilePreview preview={previewData} />}
      <button onClick={onDownload} className="download-btn">
        Download File
      </button>
    </div>
  );
}
