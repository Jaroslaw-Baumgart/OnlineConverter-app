import { execFile } from "child_process";
import path from "path";

import { LIBRE_OFFICE_PATH, LIBRE_OFFICE_TIMEOUT_MS } from "./constants";

export class LibreOfficeTimeoutError extends Error {
  constructor() {
    super("The conversion took too long. Please try again.");
    this.name = "LibreOfficeTimeoutError";
  }
}

export function convertLibreOfficeToPdf(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const outputDir = path.dirname(outputPath);

  return new Promise<void>((resolve, reject) => {
    execFile(
      LIBRE_OFFICE_PATH,
      ["--headless", "--convert-to", "pdf", "--outdir", outputDir, inputPath],
      {
        timeout: LIBRE_OFFICE_TIMEOUT_MS,
        killSignal: "SIGKILL",
      },

      (error) => {
        if (error && "killed" in error && error.killed) {
          reject(new LibreOfficeTimeoutError());
          return;
        }

        if (error) {
          reject(error);
          return;
        }

        resolve();
      },
    );
  });
}
