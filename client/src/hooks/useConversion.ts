import { useReducer } from "react";
import {
  conversionReducer,
  initialConversionState,
} from "../reducers/conversionReducer";

export function useConversion() {
  const [conversionState, dispatch] = useReducer(
    conversionReducer,
    initialConversionState,
  );

  const file =
    conversionState.kind === "empty"
      ? null
      : conversionState.file;

  const convertedResult =
    conversionState.kind === "success" ||
    conversionState.kind === "downloadError"
      ? {
          url: conversionState.convertedFileUrl,
          file: conversionState.convertedFile,
        }
      : null;

  const conversionError =
    conversionState.kind === "conversionError" ||
    conversionState.kind === "downloadError"
      ? conversionState.error
      : null;

  const isConverting =
    conversionState.kind === "loading";

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

  return {
    file,
    convertedResult,
    conversionError,
    isConverting,
    selectFile,
    removeFile,
  };
}