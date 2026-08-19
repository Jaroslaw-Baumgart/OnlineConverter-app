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
import { ConversionError } from "../api/conversionError";

type ConversionStatus = "idle" | "loading" | "success" | "error";

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
  const [status, setStatus] = useState<ConversionStatus>("idle");

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
    setStatus("idle");
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

    if (status === "loading") {
      return;
    }

    setStatus("loading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversionType", option.conversionType);
    formData.append("target", option.targetFormat);

    try {
      let res: Response;

      try {
        res = await fetch("http://localhost:5000/convert", {
          method: "POST",
          body: formData,
        });
      } catch (cause: unknown) {
        throw new ConversionError("network", cause);
      }

      let data: unknown;

      try {
        data = await res.json();
      } catch (cause: unknown) {
        throw new ConversionError("invalid-response", cause);
      }

      const conversionResponse = parseConversionResponse(data);

      if (!conversionResponse) {
        throw new ConversionError("invalid-response", data);
      }

      if (conversionResponse.success === false) {
        throw new ConversionError(
          conversionResponse.code,
          conversionResponse.error,
        );
      }

      if (!res.ok) {
        throw new ConversionError("conversion-failed", {
          status: res.status,
          response: conversionResponse,
        });
      }

      const [convertedFileInfo] = conversionResponse.files;
      const convertedFileUrl = toAbsoluteUrl(convertedFileInfo.url);

      try {
        const fileRes = await fetch(convertedFileUrl);

        if (!fileRes.ok) {
          throw new Error(`Download failed with status ${fileRes.status}`);
        }

        const blob = await fileRes.blob();
        const downloadedFile = new File([blob], convertedFileInfo.name, {
          type: blob.type,
        });

        setConvertedFile(convertedFileUrl);
        setConvertedPreviewFile(downloadedFile);
      } catch (cause: unknown) {
        throw new ConversionError("download-failed", cause);
      }

      setError(null);
      setStatus("success");
    } catch (err: unknown) {
      console.error(err);

      if (err instanceof ConversionError) {
        setError(err.message);
      } else {
        setError("The file could not be converted. Please try again.");
      }

      setStatus("error");
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

      <ConversionOptions
        options={availableOptions}
        onConvert={handleConvert}
        isConverting={status === "loading"}
      />

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
