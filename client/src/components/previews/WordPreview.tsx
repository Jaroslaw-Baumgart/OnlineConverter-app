import { useState, useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";

export function WordPreview({
  file,
}: {
  file: File;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (!previewRef.current) {
      return;
    }

    const container = previewRef.current;
    let active = true;

    setIsRendering(true);
    setError(null);

    renderAsync(file, container)
      .catch(() => {
        if (active) setError("Failed to render DOCX content");
      })
      .finally(() => {
        if (active) {
          setIsRendering(false);
        }
      });

    return () => {
      active = false;
    };
  }, [file]);

  return (
    <div className="word-preview" aria-busy={isRendering}>
      {isRendering ? <p>Loading DOCX content...</p> : null}

      {error ? (
        <p className="error-message" role="alert">
          {error}
        </p>
      ) : null}
      <div ref={previewRef} data-testid="docx-preview" />
    </div>
  );
}
