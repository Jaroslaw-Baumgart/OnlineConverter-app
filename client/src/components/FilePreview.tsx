import "../styles/FileConverter.css";
import { ImagePreview } from "./previews/ImagePreview";
import { TextPreview } from "./previews/TextPreview";
import { WordPreview } from "./previews/WordPreview";
import { CsvPreview } from "./previews/CsvPreview";
import { XlsxPreview } from "./previews/XlsxPreview";
import { PptxPreview } from "./previews/PptxPreview";
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
  switch (preview.kind) {
    case "image":
      return <ImagePreview url={preview.url} />;

    case "pdf":
      return <PDFPreview url={preview.url} />;

    case "text":
      return <TextPreview file={preview.file} />;

    case "word":
      return <WordPreview file={preview.file} />;

    case "csv":
      return <CsvPreview file={preview.file} />;

    case "xlsx":
      return (
        <XlsxPreview
          file={preview.file}
          onXlsxSheetChange={onXlsxSheetChange}
        />
      );

    case "pptx":
      return <PptxPreview file={preview.file} />;

    case "unsupported":
      return <UnsupportedPreview fileType={preview.fileType} />;

    default:
      return assertNever(preview);
  }
}
