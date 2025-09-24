import { useCallback } from "react";
import TextPreview from "./previews/TextPreview";
import WordPreview from "./previews/WordPreview";
import ImagePreview from "./previews/ImagePreview";
import PDFPreview from "./previews/PDFPreview";
import UnsupportedPreview from "./previews/UnsupportedPreview";

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
  const renderFilePreview = useCallback(() => {
    if (!convertedFile || !convertedPreviewFile) return null;

    const fileType = convertedPreviewFile.type;
    const fileName = convertedPreviewFile.name.toLowerCase();
    const isImage = fileType.startsWith("image/");
    const isPDF = fileType === "application/pdf" || fileName.endsWith(".pdf");
    const isText = fileType === "text/plain" || fileName.endsWith(".txt");
    const isWord =
      fileName.endsWith(".docx") || fileType.includes("wordprocessingml.document");

    if (isImage) return <ImagePreview url={convertedFile} />;
    if (isPDF) return <PDFPreview url={convertedFile} />;
    if (isText) return <TextPreview file={convertedPreviewFile} isLoading={false} />;
    if (isWord) return <WordPreview />;
    return <UnsupportedPreview fileType={fileType} />;
  }, [convertedFile, convertedPreviewFile]);

  return (
    <div className="download-section">
      <h2>Download Converted File</h2>
      {renderFilePreview()}
      <button onClick={onDownload} className="download-btn">
        Download File
      </button>
    </div>
  );
}
