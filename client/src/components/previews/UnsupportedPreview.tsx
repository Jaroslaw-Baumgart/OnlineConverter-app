export default function UnsupportedPreview({ fileType }: { fileType: string }) {
  return (
    <div className="unsupported-preview">
      <p>Preview not available for this file type</p>
      <p>Type: {fileType || "unknown"}</p>
    </div>
  );
}
