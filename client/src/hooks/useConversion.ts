import { useReducer, useRef } from "react";
import {
  conversionReducer,
  initialConversionState,
} from "../reducers/conversionReducer";
import type { ConversionOption } from "../types/converter";
import { parseConversionResponse } from "../api/conversionResponse";
import { ConversionError } from "../api/conversionError";
import { downloadFile } from "../utils/downloadFile";
import { buildApiUrl } from "../api/apiUrl";
import { fetchConvertedFile, requestConversion } from "../api/conversionClient";
import type { ConversionSettings } from "../schemas/conversionSettings";
import { createConversionFormData } from "../api/conversionFormData";

type UseConversionResult = {
  file: File | null;
  convertedResult: {
    url: string;
    file: File;
  } | null;
  conversionError: string | null;
  isConverting: boolean;
  selectFile: (selectedFile: File) => void;
  removeFile: () => void;
  convert: (
    option: ConversionOption,
    settings?: ConversionSettings,
  ) => Promise<void>;
  downloadConvertedFile: () => void;
};

export function useConversion(): UseConversionResult {
  const [conversionState, dispatch] = useReducer(
    conversionReducer,
    initialConversionState,
  );

  const requestIdRef = useRef(0);

  const file = conversionState.kind === "empty" ? null : conversionState.file;

  const isConverting = conversionState.kind === "loading";

  const convertedResult =
    conversionState.kind === "downloadError" ||
    conversionState.kind === "success"
      ? {
          url: conversionState.convertedFileUrl,
          file: conversionState.convertedFile,
        }
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
      let res: Response;

      try {
        res = await requestConversion(formData);
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
      const convertedFileUrl = buildApiUrl(convertedFileInfo.url);
      let downloadedFile: File;

      try {
        const fileRes = await fetchConvertedFile(convertedFileUrl);

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

  const downloadConvertedFile = () => {
    if (!convertedResult) return;

    try {
      downloadFile(convertedResult.file);
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

  return {
    file,
    convertedResult,
    conversionError,
    isConverting,
    selectFile,
    removeFile,
    convert,
    downloadConvertedFile,
  };
}
