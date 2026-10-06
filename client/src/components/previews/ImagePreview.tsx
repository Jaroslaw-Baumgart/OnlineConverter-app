import { useState } from "react";
import styles from "./ImagePreview.module.css";
import stateStyles from "../PreviewState.module.css";

export function ImagePreview({ url }: { url: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <p className={stateStyles["error-message"]}>Failed to load image preview</p>;
  }

  return (
    <img
      src={url}
      alt="Preview"
      onError={() => setHasError(true)}
      className={styles["preview-image"]}
      data-preview-kind="image"
    />
  );
}
