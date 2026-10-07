import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import styles from "./PreviewLightbox.module.css";
import { useTranslation } from "react-i18next";

type PreviewLightboxProps = {
  children: ReactNode;
};

export default function PreviewLightbox({
  children,
}: PreviewLightboxProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeLightbox = () => {
    setIsOpen(false);
    openButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`${styles["preview-lightbox"]} ${isOpen ? styles["is-open"] : ""}`}>
      <button
        ref={openButtonRef}
        type="button"
        className={styles["preview-expand-btn"]}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        {t("preview.expand")}
      </button>

      {isOpen ? (
        <div
          className={styles["preview-lightbox-backdrop"]}
          aria-hidden="true"
          onClick={closeLightbox}
        />
      ) : null}

      <section
        className={styles["preview-lightbox-panel"]}
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen || undefined}
        aria-label={isOpen ? t("preview.label") : undefined}
      >
        {isOpen ? (
          <button
            ref={closeButtonRef}
            type="button"
            className={styles["preview-close-btn"]}
            onClick={closeLightbox}
          >
            {t("preview.close")}
          </button>
        ) : null}

        <div className={styles["preview-lightbox-content"]}>{children}</div>
      </section>
    </div>
  );
}
