import { Request, Response } from "express";
import fsSync from "fs";
import fs from "fs/promises";
import PDFDocument from "pdfkit";
import path from "path";

import { OUTPUT_DIR } from "../utils/constants";
import { safeUnlink } from "../utils/file";
import {
  createOutputFileItem,
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/response";
import { parseCsv } from "../utils/csv";
import { pdfPageSettingsSchema } from "../schemas/conversionSettings";

const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};

export const csvToPdf = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No CSV file uploaded.");
  }

  const file = req.file;
  const baseName = getBaseFileName(file);
  const outputName = `${baseName}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const settingsResult = pdfPageSettingsSchema.safeParse(req.body);

    if (!settingsResult.success) {
      return sendErrorResponse(res, 400, "Invalid conversion settings.");
    }
    const settings = settingsResult.data;

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const csvText = await fs.readFile(file.path, "utf-8");
    const rows = parseCsv(csvText);

    if (rows.length === 0) {
      throw new Error("CSV file is empty.");
    }

    const headers = Object.keys(rows[0] ?? {});

    const doc = new PDFDocument({
      size: "A4",
      layout: settings.pageOrientation,
    });

    const stream = doc.pipe(fsSync.createWriteStream(outputPath));

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const regularFontPath = path.join(
      __dirname,
      "../assets/fonts/NotoSans-Regular.ttf",
    );

    const boldFontPath = path.join(
      __dirname,
      "../assets/fonts/NotoSans-Bold.ttf",
    );

    doc.font(boldFontPath).fontSize(10);
    doc.text(headers.join(" | "));

    doc.font(regularFontPath);

    for (const row of rows) {
      doc.text(headers.map((header) => row[header] ?? "").join(" | "));
    }
    doc.end();

    await streamFinished;
    return sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert CSV to PDF.";

    return sendErrorResponse(res, 500, errorMessage);
  } finally {
    safeUnlink(file.path);
  }
};
