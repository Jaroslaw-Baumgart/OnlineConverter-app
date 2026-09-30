import type { ConversionOption } from "../types/converter";
import PngToJpgControls from "./conversion-settings/PngToJpgControls";
import type { ConversionSettings } from "../schemas/conversionSettings";
import PdfPageControls from "./conversion-settings/PdfPageControls";

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
  return (
    <div className="options-section" aria-busy={isConverting}>
      {isConverting && (
        <div className="conversion-overlay" role="status" aria-live="polite">
          <span>Converting</span>
          <span className="loading-dots" aria-hidden="true" />
        </div>
      )}
      <h2>Conversion Options</h2>
      <div className="options-grid">
        {options.map((option) => (
          <div key={option.conversionType} className="option-card">
            <div className="option-content">
              <div className="option-text">
                <span className="format">
                  {option.sourceFormat.toUpperCase()}
                </span>
                <span className="arrow">→</span>
                <span className="format">
                  {option.targetFormat.toUpperCase()}
                </span>
              </div>
              {option.conversionType === "png-to-jpg" &&
              option.disabled === false ? (
                <PngToJpgControls
                  disabled={option.disabled || isConverting}
                  onConvert={(settings) => onConvert(option, settings)}
                />
              ) : (option.conversionType === "jpg-to-pdf" ||
                  option.conversionType === "txt-to-pdf" ||
                  option.conversionType === "csv-to-pdf" ||
                  option.conversionType === "xlsx-to-pdf") &&
                option.disabled === false ? (
                <PdfPageControls
                  disabled={
                    option.disabled ||
                    isConverting ||
                    (option.conversionType === "xlsx-to-pdf" &&
                      selectedXlsxSheetName === null)
                  }
                  onConvert={(settings) => {
                    if (option.conversionType !== "xlsx-to-pdf") {
                      onConvert(option, settings);
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

                    onConvert(option, xlsxSettings);
                  }}
                />
              ) : (
                <button
                  className="convert-btn"
                  onClick={() => onConvert(option)}
                  disabled={option.disabled || isConverting}
                >
                  Convert
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
