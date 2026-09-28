import { execFile } from "child_process";

import { OFFICE2PDF_PATH } from "./constants";

export function convertOfficeToPdf(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    execFile(OFFICE2PDF_PATH, [inputPath, "--output", outputPath], (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
