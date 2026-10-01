import { Request, Response } from "express";
import { sendErrorResponse } from "../utils/response";
import { conversionDefinitions } from "../config/conversions";
import path from "path";
import { safeUnlink } from "../utils/file";

export async function routeDispatcher(req: Request, res: Response) {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No file uploaded.");
  }

  const file = req.file;

  try {
    const conversionType = (req.body.conversionType || "").toLowerCase();

    if (!conversionType) {
      return sendErrorResponse(res, 400, "Please specify conversionType.");
    }

    const definition = conversionDefinitions.find(
      (candidate) => candidate.conversionType === conversionType,
    );

    if (!definition) {
      return sendErrorResponse(res, 400, "Unsupported conversion type.");
    }

    const fileExtension = path
      .extname(file.originalname)
      .substring(1)
      .toLowerCase();

    if (definition.sourceExtension !== fileExtension) {
      return sendErrorResponse(
        res,
        400,
        "File type does not match conversion type.",
      );
    }

    if (file.mimetype !== definition.mimeType) {
      return sendErrorResponse(
        res,
        400,
        "File type does not match conversion type.",
      );
    }

    return await definition.handler(req, res);
  } finally {
    await safeUnlink(file.path);
  }
}
