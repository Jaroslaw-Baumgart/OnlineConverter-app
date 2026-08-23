export type ConversionState =
  | {
      kind: "empty";
    }
  | {
      kind: "ready";
      file: File;
    }
  | {
      kind: "loading";
      file: File;
    }
  | {
      kind: "success";
      file: File;
      convertedFileUrl: string;
      convertedFile: File;
    }
  | {
      kind: "conversionError";
      file: File;
      error: string;
    }
  | {
      kind: "downloadError";
      file: File;
      convertedFileUrl: string;
      convertedFile: File;
      error: string;
    };

export type ConversionAction =
  | {
      type: "fileSelected";
      file: File;
    }
  | {
      type: "fileRemoved";
    }
  | {
      type: "conversionStarted";
    }
  | {
      type: "conversionSucceeded";
      convertedFileUrl: string;
      convertedFile: File;
    }
  | {
      type: "conversionFailed";
      error: string;
    }
  | {
      type: "downloadFailed";
      error: string;
    }
  | {
      type: "downloadSucceeded";
    };

function assertNever(value: never): never {
  throw new Error(`Unhandled conversion action: ${JSON.stringify(value)}`);
}

export const initialConversionState: ConversionState = {
  kind: "empty",
};

export function conversionReducer(
  state: ConversionState,
  action: ConversionAction,
): ConversionState {
  switch (action.type) {
    case "fileSelected":
      return {
        kind: "ready",
        file: action.file,
      };

    case "fileRemoved":
      return {
        kind: "empty",
      };

    case "conversionStarted":
      if (
        state.kind !== "ready" &&
        state.kind !== "conversionError" &&
        state.kind !== "success" &&
        state.kind !== "downloadError"
      ) {
        return state;
      }

      return {
        kind: "loading",
        file: state.file,
      };

    case "conversionSucceeded":
      if (state.kind !== "loading") {
        return state;
      }

      return {
        kind: "success",
        file: state.file,
        convertedFileUrl: action.convertedFileUrl,
        convertedFile: action.convertedFile,
      };

    case "conversionFailed":
      if (state.kind !== "loading") {
        return state;
      }

      return {
        kind: "conversionError",
        file: state.file,
        error: action.error,
      };

    case "downloadFailed":
      if (state.kind !== "success") {
        return state;
      }

      return {
        kind: "downloadError",
        file: state.file,
        convertedFileUrl: state.convertedFileUrl,
        convertedFile: state.convertedFile,
        error: action.error,
      };

    case "downloadSucceeded":
      if (state.kind !== "downloadError") {
        return state;
      }

      return {
        kind: "success",
        file: state.file,
        convertedFileUrl: state.convertedFileUrl,
        convertedFile: state.convertedFile,
      };
  }

  return assertNever(action);
}
