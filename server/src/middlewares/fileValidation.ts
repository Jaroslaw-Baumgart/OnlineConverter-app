import { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import { validateFileSecure } from "../utils/sourceValidation";

const ALLOWED_EXT = [".pdf", ".txt", ".jpg", ".png", ".docx"];
const ALLOWED_MIME = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
];

export async function fileValidation(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    await validateFileSecure(
      req.file.path,
      req.file.originalname,
      ALLOWED_EXT,
      ALLOWED_MIME,
      10
    );
    next();
  } catch (err: any) {
    await fs.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: err.message });
  }
}
