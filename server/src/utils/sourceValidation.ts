import path from "path";
import fs from "fs/promises";
import { fromBuffer } from "file-type";

export async function validateFileSecure(
  filePath: string,
  originalName: string,
  allowedExt: string[],
  allowedMime: string[],
  maxSizeMB: number = 10
) {
  const stat = await fs.stat(filePath);

  const fileSizeMB = stat.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    throw new Error(`File is too large. Max size: ${maxSizeMB} MB`);
  }

  const ext = path.extname(originalName).toLowerCase();
  if (!allowedExt.includes(ext)) {
    throw new Error(`Invalid file extension. Allowed: ${allowedExt.join(", ")}`);
  }

  const parts = originalName.split(".");
  if (parts.length > 2) {
    throw new Error("Suspicious file name. Multiple extensions are not allowed.");
  }

  const buffer = await fs.readFile(filePath);
  const type = await fromBuffer(buffer);

  // Special handling for TXT files
  if (ext === ".txt") {
    const mime = type?.mime as string | undefined;
    if (!mime || mime === "application/octet-stream" || mime.startsWith("text/")) {
      return; // allowed
    }
    throw new Error(`Invalid MIME type for TXT. Detected: ${mime}`);
  }

  // Normal check for other files
  const mime = type?.mime as string | undefined;
  if (!mime || !allowedMime.includes(mime)) {
    throw new Error(`Invalid MIME type. Detected: ${mime || "unknown"}`);
  }
}
