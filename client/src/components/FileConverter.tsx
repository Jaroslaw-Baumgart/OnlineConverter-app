import { useState, useEffect } from "react";
import "../styles/FileConverter.css";
import type { ConversionOption, FileConverterProps } from "../types/converter";
import { readFileAsText } from "../utils/fileUtils";
import FileUpload from "./FileUpload";
import ConversionOptions from "./ConversionOptions";
import DownloadSection from "./DownloadSection";
import type { ConversionDefinition } from "../config/conversions";
import FilePreview from "./FilePreview";
import { createPreviewData } from "../utils/previewMapper";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { useConversion } from "../hooks/useConversion";
import type { PngToJpgSettings } from "../schemas/conversionSettings";

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
    convertedResult,
    conversionError,
    isConverting,
    selectFile,
    removeFile,
    convert,
    downloadConvertedFile,
  } = useConversion();

  const [isLoadingText, setIsLoadingText] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const error = conversionError ?? previewError;

  const previewUrl = useObjectUrl(file);
  const availableOptions = getAvailableOptions(file, conversionOptions);
  const previewData =
    file && previewUrl
      ? createPreviewData(file, previewUrl, isLoadingText)
      : null;

  useEffect(() => {
    const loadTextContent = async () => {
      if (file && (file.type === "text/plain" || file.name.endsWith(".txt"))) {
        setIsLoadingText(true);
        try {
          await readFileAsText(file);
          setPreviewError(null);
        } catch {
          setPreviewError("Failed to read file content");
        } finally {
          setIsLoadingText(false);
        }
      }
    };
    loadTextContent();
  }, [file]);

  const handleFileSelect = (selectedFile: File) => {
    setPreviewError(null);
    selectFile(selectedFile);
  };

  const handleFileRemove = () => {
    setPreviewError(null);
    removeFile();
  };

  const handleConvert = async (
    option: ConversionOption,
    settings?: PngToJpgSettings,
  ) => {
    if (!file) {
      setPreviewError("Please upload a file first.");
      return;
    }

    setPreviewError(null);
    await convert(option, settings);
  };

  const handleDownloadBlob = () => {
    if (!convertedResult) return;

    setPreviewError(null);
    downloadConvertedFile();
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
          <FilePreview preview={previewData} />
        </div>
      )}

      <ConversionOptions
        options={availableOptions}
        onConvert={handleConvert}
        isConverting={isConverting}
      />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {convertedResult && (
        <DownloadSection
          convertedFile={convertedResult.url}
          convertedPreviewFile={convertedResult.file}
          onDownload={handleDownloadBlob}
        />
      )}
    </div>
  );
}
