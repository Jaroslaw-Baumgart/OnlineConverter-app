import type { ConversionOption } from "../types/converter";
import PngToJpgControls from "./conversion-settings/PngToJpgControls";
import type { ConversionSettings } from "../schemas/conversionSettings";
import PdfPageControls from "./conversion-settings/PdfPageControls";
import { useState } from "react";

interface ConversionOptionsProps {
  options: ConversionOption[];
  onConvert: (option: ConversionOption, settings?: ConversionSettings) => void;
  isConverting: boolean;
  selectedXlsxSheetName: string | undefined | null;
}

export default function ConversionOptions({
  options,
  onConvert,
  isConverting,
  selectedXlsxSheetName,
}: ConversionOptionsProps) {
  const [selectedConversionType, setSelectedConversionType] = useState<
    string | null
  >(null);

  const availableOptions = options.filter((option) => !option.disabled);

  const selectedOption =
    availableOptions.find(
      (option) => option.conversionType === selectedConversionType,
    ) ?? availableOptions[0];
  return (
    <div className="options-section" aria-busy={isConverting}>
      {isConverting && (
        <div className="conversion-overlay" role="status" aria-live="polite">
          <span>Converting</span>
          <span className="loading-dots" aria-hidden="true" />
        </div>
      )}
      <h2>2. Convert this file</h2>
      <p className="conversion-section-description">Choose an output format.</p>
      <div className="options-grid" aria-label="Available conversion formats">
        {availableOptions.length === 0 ? (
          <p>Upload a file to see available conversions.</p>
        ) : (
          availableOptions.map((option) => (
            <button
              key={option.conversionType}
              type="button"
              className="option-card"
              aria-pressed={option.conversionType === selectedOption?.conversionType}
              onClick={() => setSelectedConversionType(option.conversionType)}
              disabled={isConverting}
            >
              <span className="format">
                {option.sourceFormat.toUpperCase()}
              </span>
              <span className="arrow">→</span>
              <span className="format">
                {option.targetFormat.toUpperCase()}
              </span>
            </button>
          ))
        )}
      </div>
      {selectedOption ? (
        <div className="conversion-settings">
          <h3>Conversion settings</h3>

          {selectedOption.conversionType === "png-to-jpg" ? (
            <PngToJpgControls
              disabled={isConverting}
              onConvert={(settings) => onConvert(selectedOption, settings)}
            />
          ) : selectedOption.conversionType === "jpg-to-pdf" ||
            selectedOption.conversionType === "txt-to-pdf" ||
            selectedOption.conversionType === "csv-to-pdf" ||
            selectedOption.conversionType === "xlsx-to-pdf" ? (
            <PdfPageControls
              disabled={
                isConverting ||
                (selectedOption.conversionType === "xlsx-to-pdf" &&
                  selectedXlsxSheetName === null)
              }
              onConvert={(settings) => {
                if (selectedOption.conversionType !== "xlsx-to-pdf") {
                  onConvert(selectedOption, settings);
                  return;
                }

                if (selectedXlsxSheetName === null) {
                  return;
                }

                const xlsxSettings =
                  selectedXlsxSheetName === undefined
                    ? settings
                    : {
                        ...settings,
                        sheetName: selectedXlsxSheetName,
                      };

                onConvert(selectedOption, xlsxSettings);
              }}
            />
          ) : (
            <button
              type="button"
              className="convert-btn"
              onClick={() => onConvert(selectedOption)}
              disabled={isConverting}
            >
              Convert
            </button>
          )}
        </div>
      ) : (
        <p className="conversion-choice-hint">
          Choose an output format to configure conversion.
        </p>
      )}
    </div>
  );
}
