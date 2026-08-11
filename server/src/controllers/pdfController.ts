import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import pdfPoppler from "pdf-poppler";
import pdfParse from "pdf-parse";
import { exec } from "child_process";
import { OUTPUT_DIR } from "../utils/constants";
import { safeUnlink } from "../utils/file";
import {
  createOutputFileItem,
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/response";

const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};

// PDF --> JPG
export const pdfToJpg = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No PDF file uploaded.");
  }

  const file = req.file;
  const baseName = getBaseFileName(file);
  const pdfPath = file.path;
  const outputSubdir = path.join(OUTPUT_DIR, baseName);

  try {
    await fs.mkdir(outputSubdir, { recursive: true });

    await pdfPoppler.convert(pdfPath, {
      format: "jpeg",
      out_dir: outputSubdir,
      out_prefix: "page",
      page: null,
    });

    const jpgFiles = (await fs.readdir(outputSubdir)).filter((f) =>
      f.endsWith(".jpg"),
    );

    const files = jpgFiles.map((name) => ({
      url: `/output/${baseName}/${name}`,
      name,
    }));

    const [firstFile, ...remainingFiles] = files;

    if (!firstFile) {
      return sendErrorResponse(
        res,
        500,
        "PDF conversion produced no JPG files.",
      );
    }

    return sendSuccessResponse(res, [firstFile, ...remainingFiles]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert PDF to JPG.";

    sendErrorResponse(res, 500, errorMessage);
  } finally {
    safeUnlink(file.path);
  }
};

// PDF --> TXT
export const pdfToTxt = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No PDF file uploaded.");
  }

  const file = req.file;
  const outputName = `${getBaseFileName(file)}.txt`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    try {
      const data = await pdfParse(await fs.readFile(file.path));
      await fs.writeFile(outputPath, data.text);
    } catch {
      await new Promise((resolve, reject) => {
        exec(`pdftotext "${file.path}" "${outputPath}"`, (err) =>
          err ? reject(err) : resolve(null),
        );
      });
    }

    return sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert PDF to TXT.";

    sendErrorResponse(res, 500, errorMessage);
  } finally {
    safeUnlink(file.path);
  }
};

// TXT --> PDF
export const txtToPdf = async (req: Request, res: Response) => {
  if (
    !req.file ||
    path.extname(req.file.originalname).toLowerCase() !== ".txt"
  ) {
    return sendErrorResponse(res, 400, "No TXT file uploaded.");
  }

  const file = req.file;
  const baseName = getBaseFileName(file);
  const outputName = `${baseName}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const text = await fs.readFile(file.path, "utf8");

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    const stream = doc.pipe(require("fs").createWriteStream(outputPath));

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    doc.fontSize(12).text(text, { align: "left" });
    doc.end();

    await streamFinished;

    return sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert TXT to PDF.";

    sendErrorResponse(res, 500, errorMessage);
  } finally {
    safeUnlink(file.path);
  }
};

// JPG --> PDF
export const jpgToPdf = async (req: Request, res: Response) => {
  if (
    !req.file ||
    path.extname(req.file.originalname).toLowerCase() !== ".jpg"
  ) {
    return sendErrorResponse(res, 400, "No JPG file uploaded.");
  }

  const file = req.file;
  const baseName = getBaseFileName(file);
  const outputName = `${baseName}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = doc.pipe(require("fs").createWriteStream(outputPath));

    // Wymiary obrazu
    const image = doc.openImage(file.path);
    doc.addPage({ size: [image.width, image.height] });
    doc.image(image, 0, 0);

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    doc.end();

    await streamFinished;

    return sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert JPG to PDF.";

    sendErrorResponse(res, 500, errorMessage);
  } finally {
    safeUnlink(file.path);
  }
};
