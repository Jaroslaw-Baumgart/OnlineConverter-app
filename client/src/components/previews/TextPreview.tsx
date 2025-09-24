import { useState, useEffect } from "react";
import { readFileAsText } from "../../utils/fileUtils";

export default function TextPreview({ file, isLoading }: { file: File; isLoading: boolean }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      readFileAsText(file)
        .then(setText)
        .catch(() => setError("Failed to load file content"));
    }
  }, [file, isLoading]);

  if (isLoading) return <p className="loading-message">Loading text content...</p>;
  if (error) return <p className="error-message">{error}</p>;
  return <textarea readOnly value={text} className="text-preview" />;
}
