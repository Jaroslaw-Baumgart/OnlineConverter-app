import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import pdfPoppler from "pdf-poppler";
import pdfParse from "pdf-parse";
import { exec } from "child_process";
import { OUTPUT_DIR } from "../utils/constants";
import { safeUnlink } from "../utils/file";
import { sendResponse } from "../utils/response";


const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};

// PDF --> JPG
export const pdfToJpg = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, false, "", "", undefined, undefined, "No PDF file uploaded.");
  }

  const baseName = getBaseFileName(req.file);
  const pdfPath = req.file.path;
  const outputSubdir = path.join(OUTPUT_DIR, baseName);

  try {
    await fs.mkdir(outputSubdir, { recursive: true });

    await pdfPoppler.convert(pdfPath, {
      format: "jpeg",
      out_dir: outputSubdir,
      out_prefix: "page",
      page: null
    });

    const jpgFiles = (await fs.readdir(outputSubdir)).filter(f => f.endsWith(".jpg"));

    sendResponse(
      res,
      true,
      "Conversion: PDF → JPG",
      "jpg",
      undefined,
      jpgFiles.map(name => ({
        url: `/output/${baseName}/${name}`,
        name
      }))
    );
  } catch (err: any) {
    sendResponse(res, false, "", "", undefined, undefined, err.message);
  } finally {
    safeUnlink(pdfPath);
  }
};

// PDF --> TXT
export const pdfToTxt = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, false, "", "", undefined, undefined, "No PDF file uploaded.");
  }

  const outputName = `${getBaseFileName(req.file)}.txt`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    try {
      const data = await pdfParse(await fs.readFile(req.file.path));
      await fs.writeFile(outputPath, data.text);
    } catch {
      await new Promise((resolve, reject) => {
        exec(`pdftotext "${req.file.path}" "${outputPath}"`, err =>
          err ? reject(err) : resolve(null)
        );
      });
    }

    sendResponse(res, true, "Conversion: PDF → TXT", "txt", outputName);
  } catch (err: any) {
    sendResponse(res, false, "", "", undefined, undefined, err.message);
  } finally {
    safeUnlink(req.file.path);
  }
};

// TXT --> PDF
export const txtToPdf = async (req: Request, res: Response) => {
  if (!req.file || path.extname(req.file.originalname).toLowerCase() !== ".txt") {
    return sendResponse(res, false, "", "", undefined, undefined, "No TXT file uploaded.");
  }

  const baseName = getBaseFileName(req.file);
  const outputName = `${baseName}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const text = await fs.readFile(req.file.path, "utf8");

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    const stream = doc.pipe(require("fs").createWriteStream(outputPath));

    doc.fontSize(12).text(text, { align: "left" });
    doc.end();

    stream.on("finish", () => {
      safeUnlink(req.file.path);
      sendResponse(
        res,
        true,
        "Conversion: TXT → PDF",
        "pdf",
        undefined,
        [{ url: `/output/${outputName}`, name: outputName }]
      );
    });

    stream.on("error", (err: any) => {
      safeUnlink(req.file.path);
      sendResponse(res, false, "", "", undefined, undefined, err.message);
    });
  } catch (err: any) {
    safeUnlink(req.file.path);
    sendResponse(res, false, "", "", undefined, undefined, err.message || "Failed to convert TXT to PDF.");
  }
};

// JPG --> PDF
export const jpgToPdf = async (req: Request, res: Response) => {
  if (
    !req.file ||
    path.extname(req.file.originalname).toLowerCase() !== ".jpg"
  ) {
    return sendResponse(res, false, "", "", undefined, undefined, "No JPG file uploaded.");
  }

  const baseName = getBaseFileName(req.file);
  const outputName = `${baseName}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = doc.pipe(require("fs").createWriteStream(outputPath));

    // Wymiary obrazu
    const image = doc.openImage(req.file.path);
    doc.addPage({ size: [image.width, image.height] });
    doc.image(image, 0, 0);

    doc.end();

    stream.on("finish", () => {
      safeUnlink(req.file.path);
      sendResponse(
        res,
        true,
        "Conversion: JPG → PDF",
        "pdf",
        undefined,
        [{ url: `/output/${outputName}`, name: outputName }]
      );
    });

    stream.on("error", (err: any) => {
      safeUnlink(req.file.path);
      sendResponse(res, false, "", "", undefined, undefined, err.message);
    });
  } catch (err: any) {
    safeUnlink(req.file.path);
    sendResponse(res, false, "", "", undefined, undefined, err.message || "Failed to convert JPG to PDF.");
  }
};