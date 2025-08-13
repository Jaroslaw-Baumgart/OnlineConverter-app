import { Request, Response } from "express";
import { jpgToPng, pngToJpg, jpgToPdf } from "../controllers/imageController";
import { docxToPdf } from "../controllers/docController";
import { pdfToTxt, pdfToJpg, txtToPdf } from "../controllers/pdfController";
import path from "path";

export async function routeDispatcher(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
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
        return res.status(400).json({ error: "Please specify target: jpg or txt" });
      }

    case ".docx":
      return docxToPdf(req, res);

    case ".txt":
      return txtToPdf(req, res);

    default:
      return res.status(400).json({ error: "Unsupported file type." });
  }
}
