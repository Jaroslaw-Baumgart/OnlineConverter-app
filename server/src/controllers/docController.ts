import { Request, Response } from "express";
import path from "path";
import { OUTPUT_DIR } from "../utils/constants";
import { safeUnlink } from "../utils/file";
import {
  createOutputFileItem,
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/response";
import { getConversionFailureCode } from "../utils/conversionError";
import { convertOfficeToPdf } from "../utils/office2pdf";

const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};

export const docxToPdf = async (req: Request, res: Response) => {
  if (
    !req.file ||
    path.extname(req.file.originalname).toLowerCase() !== ".docx"
  ) {
    return sendErrorResponse(res, 400, "No DOCX file uploaded.");
  }

  const outputName = `${getBaseFileName(req.file)}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);
  const file = req.file;

  // DOCX --> PDF
  try {
    await convertOfficeToPdf(file.path, outputPath);

    return sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert DOCX to PDF.";

    const errorCode = getConversionFailureCode(err);

    sendErrorResponse(res, 500, errorMessage, errorCode);
  } finally {
    safeUnlink(file.path);
  }
};
