import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { z } from "zod";

import {
  pdfPageSettingsSchema,
  type PdfPageSettings,
} from "../../schemas/conversionSettings";

interface PdfPageControlsProps {
  disabled: boolean;
  onConvert: (settings: PdfPageSettings) => void;
}

export default function PdfPageControls({
  disabled,
  onConvert,
}: PdfPageControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { register, handleSubmit } = useForm<
    z.input<typeof pdfPageSettingsSchema>,
    unknown,
    PdfPageSettings
  >({
    resolver: zodResolver(pdfPageSettingsSchema),
    defaultValues: pdfPageSettingsSchema.parse({}),
  });

  return (
    <form onSubmit={handleSubmit(onConvert)}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        Customize output
      </button>
      {isOpen && (
        <div>
          <fieldset id="pdf-page-orientation">
            <legend>Page Orientation</legend>
            <input
              type="radio"
              id="pdf-page-orientation-portrait"
              value="portrait"
              {...register("pageOrientation")}
            />
            <label htmlFor="pdf-page-orientation-portrait">Portrait</label>
            <input
              type="radio"
              id="pdf-page-orientation-landscape"
              value="landscape"
              {...register("pageOrientation")}
            />
            <label htmlFor="pdf-page-orientation-landscape">Landscape</label>
          </fieldset>
          <fieldset id="pdf-page-size">
            <legend>Page Size</legend>
            <input
              type="radio"
              id="pdf-page-size-a4"
              value="A4"
              {...register("pageSize")}
            />
            <label htmlFor="pdf-page-size-a4">A4</label>
            <input
              type="radio"
              id="pdf-page-size-a3"
              value="A3"
              {...register("pageSize")}
            />
            <label htmlFor="pdf-page-size-a3">A3</label>
          </fieldset>
        </div>
      )}
      <button type="submit" disabled={disabled}>
        Convert
      </button>
    </form>
  );
}
