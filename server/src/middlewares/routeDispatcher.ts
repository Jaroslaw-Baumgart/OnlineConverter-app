import { Request, Response } from "express";
import { jpgToPng, pngToJpg, jpgToPdf } from "../controllers/imageController";
import { docxToPdf } from "../controllers/docController";
import { pdfToTxt, pdfToJpg, txtToPdf } from "../controllers/pdfController";
import path from "path";
import { sendErrorResponse } from "../utils/response";

export async function routeDispatcher(req: Request, res: Response) {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No file uploaded.");
  }

  const file = req.file;
  const ext = path.extname(file.originalname).toLowerCase();
  const target = (req.body.target || "").toLowerCase();

  switch (ext) {
    case ".jpg":
      if (target === "pdf") {
        return jpgToPdf(req, res);
      } else {
        return jpgToPng(req, res);
      }

    case ".png":
      return pngToJpg(req, res);

    case ".pdf":
      if (target === "jpg") {
        return pdfToJpg(req, res);
      } else if (target === "txt") {
        return pdfToTxt(req, res);
      } else {
        return sendErrorResponse(res, 400, "Please specify target: jpg or txt");
      }

    case ".docx":
      return docxToPdf(req, res);

    case ".txt":
      return txtToPdf(req, res);

    default:
      return sendErrorResponse(res, 400, "Unsupported file type.");
  }
}
