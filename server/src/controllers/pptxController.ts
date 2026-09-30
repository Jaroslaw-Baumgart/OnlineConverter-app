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
import { convertLibreOfficeToPdf } from "../utils/libreOffice";

const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};

export const pptxToPdf = async (req: Request, res: Response) => {
  if (
    !req.file ||
    path.extname(req.file.originalname).toLowerCase() !== ".pptx"
  ) {
    return sendErrorResponse(res, 400, "No PPTX file uploaded.");
  }

  const outputName = `${getBaseFileName(req.file)}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);
  const file = req.file;

  try {
    await convertLibreOfficeToPdf(file.path, outputPath);

    return sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert PPTX to PDF.";

    const errorCode = getConversionFailureCode(err);

    sendErrorResponse(res, 500, errorMessage, errorCode);
  } finally {
    safeUnlink(file.path);
  }
};
