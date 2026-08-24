import { useState, useEffect, useReducer } from "react";
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
import {
  conversionReducer,
  initialConversionState,
} from "../reducers/conversionReducer";

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
  const [conversionState, dispatch] = useReducer(
    conversionReducer,
    initialConversionState,
  );

  const file = conversionState.kind === "empty" ? null : conversionState.file;

  const [isLoadingText, setIsLoadingText] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const convertedResult =
    conversionState.kind === "success" ||
    conversionState.kind === "downloadError"
      ? {
          url: conversionState.convertedFileUrl,
          file: conversionState.convertedFile,
        }
      : null;

  const workflowError =
    conversionState.kind === "conversionError" ||
    conversionState.kind === "downloadError"
      ? conversionState.error
      : null;

  const error = workflowError ?? previewError;

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

    dispatch({
      type: "fileSelected",
      file: selectedFile,
    });
  };

  const handleFileRemove = () => {
    setPreviewError(null);
    dispatch({ type: "fileRemoved" });
  };

  const handleConvert = async (option: ConversionOption) => {
    if (!file) {
      setPreviewError("Please upload a file first.");
      return;
    }

    if (conversionState.kind === "loading") {
      return;
    }

    setPreviewError(null);
    dispatch({ type: "conversionStarted" });

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
      let downloadedFile: File;

      try {
        const fileRes = await fetch(convertedFileUrl);

        if (!fileRes.ok) {
          throw new Error(`Download failed with status ${fileRes.status}`);
        }

        const blob = await fileRes.blob();
        downloadedFile = new File([blob], convertedFileInfo.name, {
          type: blob.type,
        });
      } catch (cause: unknown) {
        throw new ConversionError("download-failed", cause);
      }
      dispatch({
        type: "conversionSucceeded",
        convertedFileUrl,
        convertedFile: downloadedFile,
      });
    } catch (err: unknown) {
      console.error(err);

      const errorMessage =
        err instanceof ConversionError
          ? err.message
          : "The file could not be converted. Please try again.";

      dispatch({
        type: "conversionFailed",
        error: errorMessage,
      });
    }
  };

  const handleDownloadBlob = () => {
    if (!convertedResult) return;

    try {
      downloadFile(convertedResult.file);
      setPreviewError(null);
      dispatch({ type: "downloadSucceeded" });
    } catch (cause: unknown) {
      const downloadError = new ConversionError("download-failed", cause);

      console.error(downloadError);
      dispatch({
        type: "downloadFailed",
        error: downloadError.message,
      });
    }
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
        isConverting={conversionState.kind === "loading"}
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
