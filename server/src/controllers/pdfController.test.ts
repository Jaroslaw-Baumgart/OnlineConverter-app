import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const readFile = vi.fn().mockResolvedValue("example text");
  const safeUnlink = vi.fn();

  const stream = {
    on: vi.fn((event: string, callback: () => void) => {
      if (event === "finish") {
        callback();
      }

      return stream;
    }),
  };

  const createWriteStream = vi.fn(() => stream);
  const text = vi.fn();
  const fontSize = vi.fn(() => ({ text }));
  const pipe = vi.fn(() => stream);
  const end = vi.fn();

  const PDFDocument = vi.fn(function PDFDocumentMock() {
    return {
      pipe,
      fontSize,
      end,
    };
  });

  return {
    readFile,
    safeUnlink,
    createWriteStream,
    text,
    fontSize,
    pipe,
    end,
    PDFDocument,
  };
});

vi.mock("fs/promises", () => ({
  default: {
    readFile: mocks.readFile,
  },
}));

vi.mock("fs", () => ({
  default: {
    createWriteStream: mocks.createWriteStream,
  },
}));

vi.mock("pdfkit", () => ({
  default: mocks.PDFDocument,
}));

vi.mock("../utils/file", () => ({
  safeUnlink: mocks.safeUnlink,
}));

vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

import { txtToPdf } from "./pdfController";

const createRequest = (body: unknown): Request =>
  ({
    body,
    file: {
      path: "uploads/document.txt",
      filename: "document.txt",
      originalname: "document.txt",
    } as Express.Multer.File,
  }) as Request;

const createResponse = () => {
  const status = vi.fn();
  const json = vi.fn();
  const response = { status, json };

  status.mockReturnValue(response);

  return {
    response: response as unknown as Response,
    status,
    json,
  };
};

describe("txtToPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an A4 PDF with the validated landscape orientation", async () => {
    const request = createRequest({
      pageOrientation: "landscape",
    });
    const { response, status } = createResponse();

    await txtToPdf(request, response);

    expect(mocks.readFile).toHaveBeenCalledWith("uploads/document.txt", "utf8");
    expect(mocks.PDFDocument).toHaveBeenCalledWith({
      size: "A4",
      layout: "landscape",
    });
    expect(mocks.fontSize).toHaveBeenCalledWith(12);
    expect(mocks.text).toHaveBeenCalledWith("example text", {
      align: "left",
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(mocks.safeUnlink).toHaveBeenCalledWith("uploads/document.txt");
  });

  it("rejects invalid settings before reading the text file", async () => {
    const request = createRequest({
      pageOrientation: "sideways",
    });
    const { response, status, json } = createResponse();

    await txtToPdf(request, response);

    expect(mocks.readFile).not.toHaveBeenCalled();
    expect(mocks.PDFDocument).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid conversion settings.",
      code: "conversion-failed",
    });
    expect(mocks.safeUnlink).toHaveBeenCalledWith("uploads/document.txt");
  });
});
