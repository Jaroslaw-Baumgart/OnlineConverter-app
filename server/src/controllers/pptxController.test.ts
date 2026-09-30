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

import { pptxToPdf } from "./pptxController";
import { OUTPUT_DIR } from "../utils/constants";

const createRequest = (): Request =>
  ({
    file: {
      path: "uploads/presentation.pptx",
      filename: "presentation.pptx",
      originalname: "presentation.pptx",
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

describe("pptxToPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts a PPTX through the LibreOffice adapter", async () => {
    mocks.convertLibreOfficeToPdf.mockResolvedValue(undefined);
    const { response, status, json } = createResponse();

    await pptxToPdf(createRequest(), response);

    expect(mocks.convertLibreOfficeToPdf).toHaveBeenCalledWith(
      "uploads/presentation.pptx",
      path.join(OUTPUT_DIR, "presentation.pdf"),
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      files: [
        {
          name: "presentation.pdf",
          url: "/output/presentation.pdf",
        },
      ],
    });
    expect(mocks.safeUnlink).toHaveBeenCalledWith("uploads/presentation.pptx");
  });

  it("returns a safe error and removes the upload when LibreOffice fails", async () => {
    mocks.convertLibreOfficeToPdf.mockRejectedValue(
      Object.assign(new Error("LibreOffice is unavailable"), {
        code: "ENOENT",
      }),
    );
    const { response, status, json } = createResponse();

    await pptxToPdf(createRequest(), response);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: "LibreOffice is unavailable",
      code: "tool-unavailable",
    });
    expect(mocks.safeUnlink).toHaveBeenCalledWith("uploads/presentation.pptx");
  });
});
