import { useState, useEffect } from "react";
import { getSlides, loadPresentation } from "@office-kit/pptx";
import { renderSlideToSvg } from "@office-kit/pptx-preview";

export function PptxPreview({ file }: { file: File }) {
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [slideUrls, setSlideUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    let objectUrls: string[] = [];

    const renderPreview = async () => {
      setIsRendering(true);
      setError(null);
      setSlideUrls([]);

      try {
        const bytes = await file.arrayBuffer();
        const presentation = await loadPresentation(bytes);
        const slides = getSlides(presentation);

        if (slides.length === 0) {
          throw new Error("Presentation has no slides");
        }

        objectUrls = slides.map((slide) => {
          const svg = renderSlideToSvg(presentation, slide);

          return URL.createObjectURL(
            new Blob([svg], { type: "image/svg+xml" }),
          );
        });

        if (active) {
          setSlideUrls(objectUrls);
        } else {
          objectUrls.forEach((url) => URL.revokeObjectURL(url));
        }
      } catch {
        if (active) {
          setError("Failed to render PowerPoint presentation.");
        }
      } finally {
        if (active) {
          setIsRendering(false);
        }
      }
    };

    void renderPreview();

    return () => {
      active = false;

      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [file]);

  return (
    <div className="pptx-preview" aria-busy={isRendering}>
      {isRendering ? <p>Loading PPTX content...</p> : null}

      {error ? (
        <p className="error-message" role="alert">
          {error}
        </p>
      ) : null}
      {slideUrls.map((slideUrl, index) => (
        <img
          key={slideUrl}
          className="pptx-slide-preview"
          src={slideUrl}
          alt={`PowerPoint slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
