import { useState } from "react";
import "../styles/FileConverter.css";
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

  const [formError, setFormError] = useState<string | null>(null);
  const error = conversionError ?? formError;

  const previewUrl = useObjectUrl(file);
  const availableOptions = getAvailableOptions(file, conversionOptions);
  const previewData =
    file && previewUrl ? createPreviewData(file, previewUrl) : null;

  const [selectedXlsxSheetName, setSelectedXlsxSheetName] = useState<
    string | undefined | null
  >(null);

  const handleFileSelect = (selectedFile: File) => {
    setFormError(null);
    selectFile(selectedFile);
    setSelectedXlsxSheetName(null);
  };

  const handleFileRemove = () => {
    setFormError(null);
    removeFile();
    setSelectedXlsxSheetName(null);
  };

  const handleConvert = async (
    option: ConversionOption,
    settings?: ConversionSettings,
  ) => {
    if (!file) {
      setFormError("Please upload a file first.");
      return;
    }

    setFormError(null);
    await convert(option, settings);
  };

  const handleDownloadBlob = (result: ConvertedResult) => {
    setFormError(null);
    downloadConvertedFile(result);
  };

  return (
    <div className="converter-container">
      <FileUpload
        file={file}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
      />

      {previewData && (
        <div className="file-preview">
          <FilePreview
            preview={previewData}
            onXlsxSheetChange={setSelectedXlsxSheetName}
          />
        </div>
      )}

      <ConversionOptions
        options={availableOptions}
        onConvert={handleConvert}
        isConverting={isConverting}
        selectedXlsxSheetName={selectedXlsxSheetName}
      />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {convertedResults && (
        <DownloadSection
          convertedResults={convertedResults}
          onDownload={handleDownloadBlob}
          isPreparingArchive={isPreparingArchive}
          onDownloadAll={downloadAllConvertedFiles}
        />
      )}
    </div>
  );
}
