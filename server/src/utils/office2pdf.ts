import { execFile } from "child_process";

import { OFFICE2PDF_PATH } from "./constants";

type OfficeToPdfOptions = {
  sheetNames?: string[];
};

export function convertOfficeToPdf(
  inputPath: string,
  outputPath: string,
  options: OfficeToPdfOptions = {},
): Promise<void> {
  const args = [inputPath, "--output", outputPath];

  if (options.sheetNames && options.sheetNames.length > 0) {
    args.push("--sheets", options.sheetNames.join(","));
  }

  return new Promise<void>((resolve, reject) => {
    execFile(OFFICE2PDF_PATH, args, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
