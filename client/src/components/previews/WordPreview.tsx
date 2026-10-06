import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import styles from "./WordPreview.module.css";
import stateStyles from "../PreviewState.module.css";

export function WordPreview({ file }: { file: File }) {
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
        if (active) {
          setError("Failed to render DOCX content");
        }
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
    <div className={styles["word-preview"]} data-preview-kind="word" aria-busy={isRendering}>
      {isRendering ? <p>Loading DOCX content...</p> : null}

      {error ? (
        <p className={stateStyles["error-message"]} role="alert">
          {error}
        </p>
      ) : null}

      <div ref={previewRef} data-testid="docx-preview" />
    </div>
  );
}
