import { Request, Response } from "express";
import fsSync from "fs";
import fs from "fs/promises";
import PDFDocument from "pdfkit";
import path from "path";

import { OUTPUT_DIR } from "../utils/constants";
import {
  createOutputFileItem,
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/response";
import { parseCsv } from "../utils/csv";
import { pdfPageSettingsSchema } from "../schemas/conversionSettings";

const getBaseFileName = (file: Express.Multer.File) => {
  return path.parse(file.filename).name;
};

export const csvToPdf = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, "No CSV file uploaded.");
  }

  const file = req.file;
  const baseName = getBaseFileName(file);
  const outputName = `${baseName}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const settingsResult = pdfPageSettingsSchema.safeParse(req.body);

    if (!settingsResult.success) {
      return sendErrorResponse(res, 400, "Invalid conversion settings.");
    }
    const settings = settingsResult.data;

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const csvText = await fs.readFile(file.path, "utf-8");
    const rows = parseCsv(csvText);

    if (rows.length === 0) {
      return sendErrorResponse(res, 400, "CSV file is empty.");
    }

    const headers = Object.keys(rows[0] ?? {});

    const doc = new PDFDocument({
      size: settings.pageSize,
      layout: settings.pageOrientation,
    });

    const stream = doc.pipe(fsSync.createWriteStream(outputPath));

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const regularFontPath = path.join(
      __dirname,
      "../assets/fonts/NotoSans-Regular.ttf",
    );

    const boldFontPath = path.join(
      __dirname,
      "../assets/fonts/NotoSans-Bold.ttf",
    );

    const margin = 36;
    const cellPadding = 6;
    const rowHeight = 24;
    const tableWidth = doc.page.width - margin * 2;
    const minFontSize = 5;
    const maxFontSize = 10;

    let fontSize = minFontSize;

    for (
      let candidateSize = maxFontSize;
      candidateSize >= minFontSize;
      candidateSize -= 1
    ) {
      doc.font(regularFontPath).fontSize(candidateSize);

      const requiredTableWidth = headers.reduce((totalWidth, header) => {
        const widestValue = Math.max(
          doc.widthOfString(header),
          ...rows.map((row) => doc.widthOfString(row[header] ?? "")),
        );

        return totalWidth + widestValue + cellPadding * 2;
      }, 0);

      if (requiredTableWidth <= tableWidth) {
        fontSize = candidateSize;
        break;
      }
    }

    const columnWidth = tableWidth / headers.length;

    const getRowHeight = (values: string[]) => {
      const contentWidth = columnWidth - cellPadding * 2;

      const tallestContent = Math.max(
        ...values.map((value) =>
          doc.heightOfString(value, { width: contentWidth }),
        ),
      );

      return Math.max(rowHeight, tallestContent + cellPadding * 2);
    };

    const drawCell = (
      value: string,
      x: number,
      y: number,
      height: number,
      isHeader = false,
    ) => {
      if (isHeader) {
        doc.rect(x, y, columnWidth, height).fill("#e8eef7");
      }

      doc
        .rect(x, y, columnWidth, height)
        .lineWidth(0.5)
        .strokeColor("#94a3b8")
        .stroke();

      doc.fillColor("#111827").text(value, x + cellPadding, y + cellPadding, {
        width: columnWidth - cellPadding * 2,
        height: height - cellPadding * 2,
      });
    };

    let y = margin;

    const drawHeaders = () => {
      doc.font(boldFontPath).fontSize(fontSize);

      const headerHeight = getRowHeight(headers);

      headers.forEach((header, columnIndex) => {
        const x = margin + columnIndex * columnWidth;

        drawCell(header, x, y, headerHeight, true);
      });

      y += headerHeight;
      doc.font(regularFontPath).fontSize(fontSize).fillColor("#111827");
    };

    drawHeaders();

    for (const row of rows) {
      const values = headers.map((header) => row[header] ?? "");
      const currentRowHeight = getRowHeight(values);

      if (y + currentRowHeight > doc.page.height - margin) {
        doc.addPage();
        y = margin;
        drawHeaders();
      }

      values.forEach((value, columnIndex) => {
        const x = margin + columnIndex * columnWidth;

        drawCell(value, x, y, currentRowHeight);
      });

      y += currentRowHeight;
    }

    doc.end();

    await streamFinished;
    return sendSuccessResponse(res, [createOutputFileItem(outputName)]);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to convert CSV to PDF.";

    return sendErrorResponse(res, 500, errorMessage);
  }
};
