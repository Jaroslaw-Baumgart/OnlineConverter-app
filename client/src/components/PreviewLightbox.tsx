import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type PreviewLightboxProps = {
  children: ReactNode;
};

export default function PreviewLightbox({
  children,
}: PreviewLightboxProps) {
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
    <div className={`preview-lightbox ${isOpen ? "is-open" : ""}`}>
      <button
        ref={openButtonRef}
        type="button"
        className="preview-expand-btn"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        Expand preview
      </button>

      {isOpen ? (
        <div
          className="preview-lightbox-backdrop"
          aria-hidden="true"
          onClick={closeLightbox}
        />
      ) : null}

      <section
        className="preview-lightbox-panel"
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen || undefined}
        aria-label={isOpen ? "File preview" : undefined}
      >
        {isOpen ? (
          <button
            ref={closeButtonRef}
            type="button"
            className="preview-close-btn"
            onClick={closeLightbox}
          >
            Close preview
          </button>
        ) : null}

        <div className="preview-lightbox-content">{children}</div>
      </section>
    </div>
  );
}