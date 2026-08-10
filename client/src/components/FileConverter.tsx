import { useState, useEffect } from "react";
import "../styles/FileConverter.css";
import type { ConversionOption, FileConverterProps } from "../types/converter";
import { readFileAsText, toAbsoluteUrl } from "../utils/fileUtils";
import FileUpload from "./FileUpload";
import ConversionOptions from "./ConversionOptions";
import DownloadSection from "./DownloadSection";
import type { ConversionDefinition } from "../config/conversions";
import FilePreview from "./FilePreview";
import { createPreviewData } from "../utils/previewMapper";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { downloadFile } from "../utils/downloadFile";
import { parseConversionResponse } from "../api/conversionResponse";

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
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedPreviewFile, setConvertedPreviewFile] = useState<File | null>(
    null,
  );
  const [convertedFile, setConvertedFile] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

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
          setError(null);
        } catch {
          setError("Failed to read file content");
        } finally {
          setIsLoadingText(false);
        }
      }
    };
    loadTextContent();
  }, [file]);

  const resetConversionState = () => {
    setConvertedFile(null);
    setConvertedPreviewFile(null);
    setError(null);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    resetConversionState();
  };

  const handleFileRemove = () => {
    setFile(null);
    resetConversionState();
  };
  const handleConvert = async (option: ConversionOption) => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversionType", option.conversionType);
    formData.append("target", option.targetFormat);

    try {
      const res = await fetch("http://localhost:5000/convert", {
        method: "POST",
        body: formData,
      });

      const data: unknown = await res.json();
      const conversionResponse = parseConversionResponse(data);

      if (!conversionResponse) {
        throw new Error("Backend returned an invalid response");
      }

      if (conversionResponse.success === false) {
        setError(conversionResponse.error);
        return;
      }

      if (!res.ok) {
        throw new Error("Conversion failed");
      }

      const [convertedFileInfo] = conversionResponse.files;
      const convertedFileUrl = toAbsoluteUrl(convertedFileInfo.url);

      setConvertedFile(convertedFileUrl);

      const fileRes = await fetch(convertedFileUrl);
      if (!fileRes.ok) throw new Error("Failed to fetch converted file");

      const blob = await fileRes.blob();
      const downloadedFile = new File([blob], convertedFileInfo.name, {
        type: blob.type,
      });
      setConvertedPreviewFile(downloadedFile);

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error converting file");
    }
  };

  const handleDownloadBlob = () => {
    if (!convertedPreviewFile) return;

    downloadFile(convertedPreviewFile);
  };

  return (
    <div className="converter-container">
      {error && <div className="error-message">{error}</div>}

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

      <ConversionOptions options={availableOptions} onConvert={handleConvert} />

      {convertedPreviewFile && convertedFile && (
        <DownloadSection
          convertedFile={convertedFile}
          convertedPreviewFile={convertedPreviewFile}
          onDownload={handleDownloadBlob}
        />
      )}
    </div>
  );
}
