import { useState, useEffect } from "react";
import { readFileAsText } from "../../utils/fileUtils";
import styles from "./TextPreview.module.css";
import stateStyles from "../PreviewState.module.css";

export function TextPreview({ file }: { file: File }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setText("");

    readFileAsText(file)
      .then((content) => {
        if (active) {
          setText(content);
        }
      })
      .catch(() => {
        if (active) {
          setError("Failed to load file content");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [file]);

  if (isLoading)
    return <p className={stateStyles["loading-message"]}>Loading text content...</p>;

  if (error) return <p className={stateStyles["error-message"]}>{error}</p>;
  return <textarea readOnly value={text} className={styles["text-preview"]} data-preview-kind="text" />;
}
