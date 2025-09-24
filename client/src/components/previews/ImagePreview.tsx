import { useState } from "react";

export default function ImagePreview({ url }: { url: string }) {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <p className="error-message">Failed to load image preview</p>;
  return <img src={url} alt="Preview" onError={() => setHasError(true)} className="preview-image" />;
}
