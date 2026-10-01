import path from "path";

export const OUTPUT_DIR = path.join(__dirname, "../../output");

export const LIBRE_OFFICE_PATH = path.join(
  __dirname,
  "../../../tools/libreoffice/program/soffice.com",
);

export const LIBRE_OFFICE_TIMEOUT_MS = 2 * 60 * 1000;
