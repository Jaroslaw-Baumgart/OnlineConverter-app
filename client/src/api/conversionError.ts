export type ConversionErrorCode =
  | "network"
  | "conversion-failed"
  | "invalid-response"
  | "download-failed"
  | "tool-unavailable";

const ERROR_MESSAGES = {
  network:
    "Could not connect to the conversion service. Check your connection and try again.",
  "conversion-failed": "The file could not be converted. Please try again.",
  "invalid-response":
    "The server returned an unexpected response. Please try again.",
  "download-failed":
    "The converted file could not be downloaded. Please try again.",
  "tool-unavailable":
    "This conversion is currently unavailable. Please try again later.",
} satisfies Record<ConversionErrorCode, string>;

export function getConversionErrorMessage(code: ConversionErrorCode): string {
  return ERROR_MESSAGES[code];
}

export class ConversionError extends Error {
  readonly code: ConversionErrorCode;
  readonly cause: unknown;

  constructor(code: ConversionErrorCode, cause?: unknown) {
    super(getConversionErrorMessage(code));

    this.name = "ConversionError";
    this.code = code;
    this.cause = cause;
  }
}
