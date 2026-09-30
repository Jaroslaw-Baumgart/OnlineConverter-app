import { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import { validateFileSecure } from "../utils/sourceValidation";
import { sendErrorResponse } from "../utils/response";

const ALLOWED_EXT = [".pdf", ".txt", ".jpg", ".png", ".docx", ".csv", ".xlsx", ".pptx"];
const ALLOWED_MIME = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", //docx
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", //xlsx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", //pptx
];

export async function fileValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No file uploaded.");
  }

  const file = req.file;

  try {
    await validateFileSecure(
      file.path,
      file.originalname,
      ALLOWED_EXT,
      ALLOWED_MIME,
      10,
    );
    next();
  } catch (err: unknown) {
    await fs.unlink(file.path).catch(() => {});

    const errorMessage =
      err instanceof Error ? err.message : "File validation failed.";

    return sendErrorResponse(res, 400, errorMessage);
  }
}
