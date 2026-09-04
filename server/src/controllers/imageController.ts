import { Request, Response } from "express";
import path from "path";
import sharp from "sharp";
import PDFDocument from "pdfkit";
import { OUTPUT_DIR } from "../utils/constants";
import { safeUnlink } from "../utils/file";
import fs from "fs";
import {
  createOutputFileItem,
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/response";
import { pngToJpgSettingsSchema } from "../schemas/conversionSettings";

const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};

// JPG --> PNG
export const jpgToPng = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No JPG file uploaded.");
  }

  const outputName = `${getBaseFileName(req.file)}.png`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    await sharp(req.file.path).png().toFile(outputPath);

    sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert JPG to PNG.";

    sendErrorResponse(res, 500, errorMessage);
  } finally {
    safeUnlink(req.file.path);
  }
};

// PNG --> JPG
export const pngToJpg = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No PNG file uploaded.");
  }

  const outputName = `${getBaseFileName(req.file)}.jpg`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const settingsResult = pngToJpgSettingsSchema.safeParse(req.body);

    if (!settingsResult.success) {
      return sendErrorResponse(res, 400, "Invalid conversion settings.");
    }
    const settings = settingsResult.data;

    await sharp(req.file.path)
      .flatten({ background: settings.backgroundColor })
      .jpeg({ quality: settings.quality })
      .toFile(outputPath);

    sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert PNG to JPG.";

    sendErrorResponse(res, 500, errorMessage);
  } finally {
    safeUnlink(req.file.path);
  }
};

// JPG --> PDF
export const jpgToPdf = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No JPG file uploaded.");
  }

  const outputName = `${getBaseFileName(req.file)}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.addPage({ size: [595.28, 841.89] }); // A4
    doc.image(req.file.path, {
      fit: [500, 700],
      align: "center",
      valign: "center",
    });

    await new Promise<void>((resolve, reject) => {
      const stream = doc.pipe(fs.createWriteStream(outputPath));
      stream.on("finish", resolve);
      stream.on("error", reject);
      doc.end();
    });

    sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert JPG to PDF.";

    sendErrorResponse(res, 500, errorMessage);
  } finally {
    safeUnlink(req.file.path);
  }
};
