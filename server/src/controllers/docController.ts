import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import { OUTPUT_DIR } from "../utils/constants";
import { safeUnlink } from "../utils/file";
import fsSync from "fs";
import {
  createOutputFileItem,
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/response";

const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};

export const docxToPdf = async (req: Request, res: Response) => {
  if (
    !req.file ||
    path.extname(req.file.originalname).toLowerCase() !== ".docx"
  ) {
    return sendErrorResponse(res, 400, "No DOCX file uploaded.");
  }

  const outputName = `${getBaseFileName(req.file)}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);
  const file = req.file;

  // DOCX --> PDF
  try {
    await new Promise((resolve, reject) => {
      exec(
        `soffice --headless --convert-to pdf --outdir "${OUTPUT_DIR}" "${file.path}"`,
        (err) => {
          if (err) reject(err);
          else resolve(null);
        },
      );
    });

    const originalOutputPath = path.join(
      OUTPUT_DIR,
      `${path.parse(file.originalname).name}.pdf`,
    );
    if (
      originalOutputPath !== outputPath &&
      fsSync.existsSync(originalOutputPath)
    ) {
      await fs.rename(originalOutputPath, outputPath);
    }

    sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert DOCX to PDF.";

    sendErrorResponse(res, 500, errorMessage);
  } finally {
    safeUnlink(file.path);
  }
};
