import { Request, Response } from "express";
import path from "path";
import sharp from "sharp";
import PDFDocument from "pdfkit";
import { OUTPUT_DIR } from "../utils/constants";
import { safeUnlink } from "../utils/file";
import fs from "fs";
import { sendResponse } from "../utils/response";

const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};

// JPG --> PNG
export const jpgToPng = async (req: Request, res: Response) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, error: "No JPG file uploaded." });

  const outputName = `${getBaseFileName(req.file)}.png`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    await sharp(req.file.path).png().toFile(outputPath);
    sendResponse(res, true, "Conversion: JPG → PNG", "png", outputName);
  } catch (err: any) {
    sendResponse(res, false, "", "", undefined, err.message);
  } finally {
    safeUnlink(req.file.path);
  }
};

// PNG --> JPG
export const pngToJpg = async (req: Request, res: Response) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, error: "No PNG file uploaded." });

  const outputName = `${getBaseFileName(req.file)}.jpg`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    await sharp(req.file.path).jpeg().toFile(outputPath);
    sendResponse(res, true, "Conversion: PNG → JPG", "jpg", outputName);
  } catch (err: any) {
    sendResponse(res, false, "", "", undefined, err.message);
  } finally {
    safeUnlink(req.file.path);
  }
};

// JPG --> PDF
export const jpgToPdf = async (req: Request, res: Response) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, error: "No JPG file uploaded." });

  const outputName = `${getBaseFileName(req.file)}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.addPage({ size: [595.28, 841.89] }); // A4
    doc.image(req.file.path, {
      fit: [500, 700],
      align: "center",
      valign: "center"
    });

    await new Promise<void>((resolve, reject) => {
      const stream = doc.pipe(fs.createWriteStream(outputPath));
      stream.on("finish", resolve);
      stream.on("error", reject);
      doc.end();
    });

    sendResponse(res, true, "Conversion: JPG → PDF", "pdf", outputName);
  } catch (err: any) {
    sendResponse(res, false, "", "", undefined, err.message);
  } finally {
    safeUnlink(req.file.path);
  }
};
