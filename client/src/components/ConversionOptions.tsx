import type { ConversionOption } from "../types/converter";
import PngToJpgControls from "./conversion-settings/PngToJpgControls";
import type { ConversionSettings } from "../schemas/conversionSettings";
import PdfPageControls from "./conversion-settings/PdfPageControls";
import { useState } from "react";
import styles from "./ConversionOptions.module.css";
import panelStyles from "./ConverterPanel.module.css";
import primaryActionStyles from "./PrimaryAction.module.css";
import stateStyles from "./PreviewState.module.css";
import { FileIcon } from "./UiIcons";

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
    <div
      className={`${panelStyles.panel} ${styles["options-section"]}`}
      aria-busy={isConverting}
    >
      {isConverting ? (
        <p className={stateStyles["visually-hidden"]} role="status">
          Converting
        </p>
      ) : null}
      <h2 className={panelStyles.heading}>2. Convert this file</h2>
      <p className={styles["conversion-section-description"]}>Choose an output format.</p>
      <div className={styles["options-grid"]} aria-label="Available conversion formats">
        {availableOptions.length === 0 ? (
          <p>Upload a file to see available conversions.</p>
        ) : (
          availableOptions.map((option) => (
            <button
              key={option.conversionType}
              type="button"
              className={styles["option-card"]}
              aria-pressed={option.conversionType === selectedOption?.conversionType}
              onClick={() => setSelectedConversionType(option.conversionType)}
              disabled={isConverting}
            >
              <FileIcon className={styles["format-icon"]} />
              <span className={styles.format}>
                {option.sourceFormat.toUpperCase()}
              </span>
              <span className={styles.arrow}>→</span>
              <span className={styles.format}>
                {option.targetFormat.toUpperCase()}
              </span>
            </button>
          ))
        )}
      </div>
      {selectedOption ? (
        <div className={styles["conversion-settings"]}>
          <h3>Conversion settings</h3>

          {selectedOption.conversionType === "png-to-jpg" ? (
            <PngToJpgControls
              disabled={isConverting}
              isConverting={isConverting}
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
              isConverting={isConverting}
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
              className={`${primaryActionStyles.button} ${styles["convert-btn"]}`}
              onClick={() => onConvert(selectedOption)}
              disabled={isConverting}
            >
              {isConverting ? (
                <>
                  <span className={primaryActionStyles.spinner} aria-hidden="true" />
                  Converting
                </>
              ) : (
                "Convert"
              )}
            </button>
          )}
        </div>
      ) : (
        <p className={styles["conversion-choice-hint"]}>
          Choose an output format to configure conversion.
        </p>
      )}
    </div>
  );
}
