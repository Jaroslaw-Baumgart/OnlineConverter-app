import { execFile } from "child_process";
import path from "path";

import { LIBRE_OFFICE_PATH } from "./constants";

export function convertLibreOfficeToPdf(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const outputDir = path.dirname(outputPath);

  return new Promise<void>((resolve, reject) => {
    execFile(
      LIBRE_OFFICE_PATH,
      ["--headless", "--convert-to", "pdf", "--outdir", outputDir, inputPath],
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      },
    );
  });
}
