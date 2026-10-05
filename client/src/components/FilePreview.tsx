import "../styles/FileConverter.css";
import { ImagePreview } from "./previews/ImagePreview";
import { TextPreview } from "./previews/TextPreview";
import { WordPreview } from "./previews/WordPreview";
import { CsvPreview } from "./previews/CsvPreview";
import { XlsxPreview } from "./previews/XlsxPreview";
import { PptxPreview } from "./previews/PptxPreview";
import PreviewLightbox from "./PreviewLightbox";
import type { PreviewData } from "../types/preview";

type FilePreviewProps = {
  preview: PreviewData;
  onXlsxSheetChange?: (sheetName: string | undefined) => void;
};

function PDFPreview({ url }: { url: string }) {
  return <iframe src={url} title="PDF Preview" className="pdf-preview" />;
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

export default function FilePreview({
  preview,
  onXlsxSheetChange,
}: FilePreviewProps) {
  let previewContent;

  switch (preview.kind) {
    case "image":
      previewContent = <ImagePreview url={preview.url} />;
      break;

    case "pdf":
      previewContent = <PDFPreview url={preview.url} />;
      break;

    case "text":
      previewContent = <TextPreview file={preview.file} />;
      break;

    case "word":
      previewContent = <WordPreview file={preview.file} />;
      break;

    case "csv":
      previewContent = <CsvPreview file={preview.file} />;
      break;

    case "xlsx":
      previewContent = (
        <XlsxPreview
          file={preview.file}
          onXlsxSheetChange={onXlsxSheetChange}
        />
      );
      break;

    case "pptx":
      previewContent = <PptxPreview file={preview.file} />;
      break;

    case "unsupported":
      previewContent = <UnsupportedPreview fileType={preview.fileType} />;
      break;

    default:
      return assertNever(preview);
  }

  return <PreviewLightbox>{previewContent}</PreviewLightbox>;
}
