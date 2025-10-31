import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import { OUTPUT_DIR } from "../utils/constants";
import { safeUnlink } from "../utils/file";
import fsSync from "fs";
import { sendResponse } from "../utils/response";



const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};


// DOCX --> PDF
export const docxToPdf = async (req: Request, res: Response) => {
  if (!req.file || path.extname(req.file.originalname).toLowerCase() !== ".docx") {
    return sendResponse(res, false, "", "", undefined, "No DOCX file uploaded.");
  }

  const outputName = `${getBaseFileName(req.file)}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    await new Promise((resolve, reject) => {
      exec(
        `soffice --headless --convert-to pdf --outdir "${OUTPUT_DIR}" "${req.file.path}"`,
        (err) => {
          if (err) reject(err);
          else resolve(null);
        }
      );
    });

    safeUnlink(req.file.path);

    const originalOutputPath = path.join(
      OUTPUT_DIR,
      `${path.parse(req.file.originalname).name}.pdf`
    );
    if (originalOutputPath !== outputPath && fsSync.existsSync(originalOutputPath)) {
      await fs.rename(originalOutputPath, outputPath);
    }

    sendResponse(res, true, "Conversion: DOCX → PDF", "pdf", outputName);
  } catch (err: any) {
    sendResponse(res, false, "", "", undefined, err.message);
  }
};
