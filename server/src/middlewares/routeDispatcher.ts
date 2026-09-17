import { Request, Response } from "express";
import { jpgToPng, pngToJpg, jpgToPdf } from "../controllers/imageController";
import { docxToPdf } from "../controllers/docController";
import { pdfToTxt, pdfToJpg, txtToPdf } from "../controllers/pdfController";
import path from "path";
import { sendErrorResponse } from "../utils/response";

const handlers = {
  "jpg-to-png": jpgToPng,
  "png-to-jpg": pngToJpg,
  "jpg-to-pdf": jpgToPdf,
  "docx-to-pdf": docxToPdf,
  "pdf-to-txt": pdfToTxt,
  "pdf-to-jpg": pdfToJpg,
  "txt-to-pdf": txtToPdf,
} as const;

export async function routeDispatcher(req: Request, res: Response) {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No file uploaded.");
  }

  const file = req.file;
  const conversionType = (req.body.conversionType || "").toLowerCase();

  if (!conversionType) {
    return sendErrorResponse(res, 400, "Please specify conversionType.");
  }

  const handler = handlers[conversionType as keyof typeof handlers];

  if (!handler) {
    return sendErrorResponse(res, 400, "Unsupported conversion type.");
  }

  const fileExtension = path
    .extname(file.originalname)
    .substring(1)
    .toLowerCase();

  const sourceFormat = conversionType.split("-")[0];

  if (sourceFormat !== fileExtension) {
    return sendErrorResponse(
      res,
      400,
      "File type does not match conversion type.",
    );
  }

  let isFileValid = false;

  switch (conversionType) {
    case "jpg-to-png":
      isFileValid = file.mimetype === "image/jpeg";
      break;
    case "png-to-jpg":
      isFileValid = file.mimetype === "image/png";
      break;
    case "jpg-to-pdf":
      isFileValid = file.mimetype === "image/jpeg";
      break;
    case "docx-to-pdf":
      isFileValid =
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      break;
    case "pdf-to-txt":
      isFileValid = file.mimetype === "application/pdf";
      break;
    case "pdf-to-jpg":
      isFileValid = file.mimetype === "application/pdf";
      break;
    case "txt-to-pdf":
      isFileValid = file.mimetype === "text/plain";
      break;
  }

  if (!isFileValid) {
    return sendErrorResponse(
      res,
      400,
      "File type does not match conversion type.",
    );
  }

  return handler(req, res);
}
