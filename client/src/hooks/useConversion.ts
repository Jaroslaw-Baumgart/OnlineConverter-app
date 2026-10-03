import { useReducer, useRef, useState } from "react";
import {
  conversionReducer,
  initialConversionState,
} from "../reducers/conversionReducer";
import type { ConversionOption } from "../types/converter";
import { ConversionError } from "../api/conversionError";
import { downloadFile } from "../utils/downloadFile";
import { convertFile } from "../api/conversionClient";
import type { ConversionSettings } from "../schemas/conversionSettings";
import { createConversionFormData } from "../api/conversionFormData";
import type {
  ConvertedResult,
  ConvertedResults,
} from "../types/conversionResult";
import { createZipFile } from "../utils/createZipFile";

type UseConversionResult = {
  file: File | null;
  convertedResults: ConvertedResults | null;
  conversionError: string | null;
  isConverting: boolean;
  isPreparingArchive: boolean;
  selectFile: (selectedFile: File) => void;
  removeFile: () => void;
  convert: (
    option: ConversionOption,
    settings?: ConversionSettings,
  ) => Promise<void>;
  downloadConvertedFile: (result: ConvertedResult) => void;
  downloadAllConvertedFiles: () => Promise<void>;
};

export function useConversion(): UseConversionResult {
  const [conversionState, dispatch] = useReducer(
    conversionReducer,
    initialConversionState,
  );

  const requestIdRef = useRef(0);

  const [isPreparingArchive, setIsPreparingArchive] = useState(false);

  const file = conversionState.kind === "empty" ? null : conversionState.file;

  const isConverting = conversionState.kind === "loading";

  const convertedResults =
    conversionState.kind === "downloadError" ||
    conversionState.kind === "success"
      ? conversionState.convertedResults
      : null;

  const conversionError =
    conversionState.kind === "downloadError" ||
    conversionState.kind === "conversionError"
      ? conversionState.error
      : null;

  const selectFile = (selectedFile: File) => {
    dispatch({
      type: "fileSelected",
      file: selectedFile,
    });
  };

  const removeFile = () => {
    dispatch({
      type: "fileRemoved",
    });
  };

  const convert = async (
    option: ConversionOption,
    settings?: ConversionSettings,
  ) => {
    if (!file) {
      return;
    }

    if (conversionState.kind === "loading") {
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    dispatch({ type: "conversionStarted", requestId });

    const formData = createConversionFormData(file, option, settings);

    try {
      const convertedResults = await convertFile(formData);

      dispatch({
        type: "conversionSucceeded",
        convertedResults,
        requestId,
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
        requestId,
      });
    }
  };

  const downloadConvertedFile = (result: ConvertedResult) => {
    try {
      downloadFile(result.file);
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

  const downloadAllConvertedFiles = async () => {
    if (!convertedResults || isPreparingArchive) {
      return;
    }

    setIsPreparingArchive(true);

    try {
      const filesToZip = convertedResults.map((result) => result.file);
      const zipFile = await createZipFile(filesToZip);
      downloadFile(zipFile);
      dispatch({ type: "downloadSucceeded" });
    } catch (cause: unknown) {
      const downloadError = new ConversionError("download-failed", cause);

      console.error(downloadError);
      dispatch({
        type: "downloadFailed",
        error: downloadError.message,
      });
    } finally {
      setIsPreparingArchive(false);
    }
  };

  return {
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
  };
}
