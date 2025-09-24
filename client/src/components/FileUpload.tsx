import { useState, DragEvent } from "react";

interface FileUploadProps {
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop?: (file: File) => void; // opcjonalny callback dla drag & drop
}

export default function FileUpload({ file, onFileChange, onFileDrop }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (onFileDrop) {
        onFileDrop(droppedFile);
      }
    }
  };

  return (
    <div
      className={`upload-section ${isDragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h2>Upload File</h2>
      <label className="file-input-label">
        Choose File
        <input type="file" className="file-input" onChange={onFileChange} />
      </label>
      <p className="drag-drop-hint">or drag & drop your file here</p>
      <span className="file-name">{file?.name || "No file chosen"}</span>
    </div>
  );
}
