import { useEffect, useRef, useState } from "react";
import styles from "./FileConverter.module.css";
import stateStyles from "./PreviewState.module.css";
import panelStyles from "./ConverterPanel.module.css";
import type { ConversionOption, FileConverterProps } from "../types/converter";
import FileUpload from "./FileUpload";
import ConversionOptions from "./ConversionOptions";
import DownloadSection from "./DownloadSection";
import type { ConversionDefinition } from "../config/conversions";
import FilePreview from "./FilePreview";
import { createPreviewData } from "../utils/previewMapper";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { useConversion } from "../hooks/useConversion";
import type { ConversionSettings } from "../schemas/conversionSettings";
import type { ConvertedResult } from "../types/conversionResult";
import { useTranslation } from "react-i18next";

function getAvailableOptions(
  file: File | null,
  conversionOptions: readonly ConversionDefinition[],
): ConversionOption[] {
  if (!file) {
    return conversionOptions.map((option) => ({
      ...option,
      disabled: true,
    }));
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  return conversionOptions.map((option) => ({
    ...option,
    disabled: option.sourceFormat !== extension,
  }));
}

export default function FileConverter({
  conversionOptions,
}: FileConverterProps) {
  const { t } = useTranslation();
  const {
    file,
    convertedResults,
    conversionError,
    isConverting,
    selectFile,
    removeFile,
    convert,
    downloadConvertedFile,
    isPreparingArchive,
    downloadAllConvertedFiles,
  } = useConversion();

  const [hasFormError, setHasFormError] = useState(false);
  const [sourceForResults, setSourceForResults] = useState<typeof convertedResults>(null);
  const showResults = Boolean(convertedResults && sourceForResults !== convertedResults);
  const error = conversionError ?? (hasFormError ? t("converter.uploadFirst") : null);

  const previewUrl = useObjectUrl(file);
  const availableOptions = getAvailableOptions(file, conversionOptions);
  const previewData =
    file && previewUrl ? createPreviewData(file, previewUrl) : null;

  const [selectedXlsxSheetName, setSelectedXlsxSheetName] = useState<
    string | undefined | null
  >(null);

  const errorRef = useRef<HTMLDivElement>(null);
  const previousErrorRef = useRef<string | null>(null);

  useEffect(() => {
    const isNewError = error !== null && previousErrorRef.current === null;

    previousErrorRef.current = error;

    if (isNewError) {
      errorRef.current?.focus();
    }
  }, [error]);

  const handleFileSelect = (selectedFile: File) => {
    setHasFormError(false);
    setSourceForResults(null);
    selectFile(selectedFile);
    setSelectedXlsxSheetName(null);
  };

  const handleFileRemove = () => {
    setHasFormError(false);
    removeFile();
    setSelectedXlsxSheetName(null);
  };

  const handleConvert = async (
    option: ConversionOption,
    settings?: ConversionSettings,
  ) => {
    if (!file) {
      setHasFormError(true);
      return;
    }

    setHasFormError(false);
    await convert(option, settings);
  };

  const handleDownloadBlob = (result: ConvertedResult) => {
    setHasFormError(false);
    downloadConvertedFile(result);
  };

  return (
    <div className={styles["converter-container"]}>
      {file && previewData ? (
        <div className={styles["conversion-workspace"]}>
          <section
            className={`${panelStyles.panel} ${styles["source-preview-section"]}`}
            aria-labelledby="source-preview-heading"
          >
            <div className={styles["preview-switcher"]} role="group" aria-label={t("workspace.previewLabel")}>
              <button type="button" aria-pressed={!showResults} onClick={() => setSourceForResults(convertedResults)}>{t("workspace.source")}</button>
              <button type="button" aria-pressed={showResults} disabled={!convertedResults} onClick={() => setSourceForResults(null)}>{t("workspace.result")}</button>
              <button type="button" className={styles["remove-file-btn"]} onClick={handleFileRemove}>{t("converter.remove")}</button>
            </div>
            <h2 id="source-preview-heading" className={styles["visually-hidden"]}>{t("workspace.previewLabel")}</h2>
            <div className={styles["source-body"]} hidden={showResults}>
            <div className={styles["preview-file-actions"]}>
              <div className={styles["file-details"]}>
                <span className={styles["preview-file-name"]} title={file.name}>{file.name}</span>
                <span className={styles.metadata}>{file.name.split(".").pop()?.toUpperCase()} {"\u00b7"} {new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(file.size / 1_000_000)} MB</span>
              </div>
            </div>

            <div className={styles["file-preview"]}>
              <FilePreview
                preview={previewData}
                onXlsxSheetChange={setSelectedXlsxSheetName}
              />
            </div>
            </div>
            {showResults && convertedResults && (
              <DownloadSection embedded convertedResults={convertedResults} onDownload={handleDownloadBlob}
                isPreparingArchive={isPreparingArchive} onDownloadAll={downloadAllConvertedFiles} />
            )}
          </section>
          <aside className={styles["conversion-sidebar"]}>
            <ConversionOptions
              options={availableOptions}
              onConvert={handleConvert}
              isConverting={isConverting}
              selectedXlsxSheetName={selectedXlsxSheetName}
            />
          </aside>
        </div>
      ) : file ? (
        <p className={stateStyles["loading-message"]} role="status">
          {t("converter.preparing")}
        </p>
      ) : (
        <div className={styles["start-screen"]}>
          <svg className={styles["start-icon"]} width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-7m-3 3 3-3 3 3"/></svg>
          <h1>{t("workspace.chooseFile")}</h1>
          <FileUpload onFileSelect={handleFileSelect} />
        </div>
      )}

      {error && (
        <div
          ref={errorRef}
          className={stateStyles["error-message"]}
          role="alert"
          tabIndex={-1}
        >
          {error}
        </div>
      )}

    </div>
  );
}
