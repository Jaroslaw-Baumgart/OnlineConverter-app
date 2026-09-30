import path from "path";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  convertLibreOfficeToPdf: vi.fn(),
  safeUnlink: vi.fn(),
}));

vi.mock("../utils/libreOffice", () => ({
  convertLibreOfficeToPdf: mocks.convertLibreOfficeToPdf,
}));

vi.mock("../utils/file", () => ({
  safeUnlink: mocks.safeUnlink,
}));

import { docxToPdf } from "./docController";
import { OUTPUT_DIR } from "../utils/constants";

const createRequest = (): Request =>
  ({
    file: {
      path: "uploads/document.docx",
      filename: "document.docx",
      originalname: "document.docx",
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

describe("docxToPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts a DOCX through the LibreOffice adapter", async () => {
    mocks.convertLibreOfficeToPdf.mockResolvedValue(undefined);
    const { response, status, json } = createResponse();

    await docxToPdf(createRequest(), response);

    expect(mocks.convertLibreOfficeToPdf).toHaveBeenCalledWith(
      "uploads/document.docx",
      path.join(OUTPUT_DIR, "document.pdf"),
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      files: [
        {
          name: "document.pdf",
          url: "/output/document.pdf",
        },
      ],
    });
    expect(mocks.safeUnlink).toHaveBeenCalledWith("uploads/document.docx");
  });

  it("returns a safe error and removes the upload when LibreOffice fails", async () => {
    mocks.convertLibreOfficeToPdf.mockRejectedValue(
      Object.assign(new Error("LibreOffice is unavailable"), {
        code: "ENOENT",
      }),
    );
    const { response, status, json } = createResponse();

    await docxToPdf(createRequest(), response);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: "LibreOffice is unavailable",
      code: "tool-unavailable",
    });
    expect(mocks.safeUnlink).toHaveBeenCalledWith("uploads/document.docx");
  });
});
