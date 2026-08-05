import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  supportedSourceFormats,
  isSupportedSourceFormat,
} from "../config/conversions";

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File) => void;
}

const SUPPORTED_FORMATS_LABEL = supportedSourceFormats
  .map((format) => format.toUpperCase())
  .join(", ");

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_EXTENSIONS = supportedSourceFormats
  .map((format) => `.${format}`)
  .join(",");

function validateFile(file: File): string | null {
  const lastDotIndex = file.name.lastIndexOf(".");

  const extension =
    lastDotIndex === -1 ? "" : file.name.slice(lastDotIndex + 1).toLowerCase();

  if (!isSupportedSourceFormat(extension)) {
    return `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS_LABEL}.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
  }

  return null;
}

export default function FileUpload({ file, onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectedFile = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onFileSelect(selectedFile);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleSelectedFile(selectedFile);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleSelectedFile(droppedFile);
    }
  };

  return (
    <section
      aria-labelledby="file-upload-heading"
      className={`upload-section ${isDragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h2 id="file-upload-heading">Upload File</h2>
      <label className="file-input-label">
        Choose File
        <input
          type="file"
          className="file-input"
          onChange={handleFileChange}
          accept={ACCEPTED_FILE_EXTENSIONS}
        />
      </label>
      <p className="drag-drop-hint">or drag & drop your file here</p>
      <p className="upload-requirements">
        Supported formats: {SUPPORTED_FORMATS_LABEL}. Maximum size:{" "}
        {MAX_FILE_SIZE_MB} MB.
      </p>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <span className="file-name">{file?.name || "No file chosen"}</span>
    </section>
  );
}
