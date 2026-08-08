import { useState, useEffect } from "react";
import { readFileAsText } from "../utils/fileUtils";
import type { PreviewData } from "../types/preview";

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

function WordPreview() {
  return (
    <div className="word-preview">
      <p>To preview Word documents, please convert them to PDF first</p>
    </div>
  );
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
      return <WordPreview />;

    case "unsupported":
      return <UnsupportedPreview fileType={preview.fileType} />;

    default:
      return assertNever(preview);
  }
}
