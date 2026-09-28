import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("child_process", () => ({
  execFile: mocks.execFile,
}));

import { OFFICE2PDF_PATH } from "./constants";
import { convertOfficeToPdf } from "./office2pdf";

describe("convertOfficeToPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs the configured executable with separate input and output arguments", async () => {
    mocks.execFile.mockImplementation(
      (
        _executablePath: string,
        _arguments: string[],
        callback: (error: Error | null) => void,
      ) => {
        callback(null);
      },
    );

    await convertOfficeToPdf(
      "uploads/source document.docx",
      "output/converted document.pdf",
    );

    expect(mocks.execFile).toHaveBeenCalledWith(
      OFFICE2PDF_PATH,
      [
        "uploads/source document.docx",
        "--output",
        "output/converted document.pdf",
      ],
      expect.any(Function),
    );
  });

  it("rejects when office2pdf reports an error", async () => {
    mocks.execFile.mockImplementation(
      (
        _executablePath: string,
        _arguments: string[],
        callback: (error: Error | null) => void,
      ) => {
        callback(new Error("office2pdf failed"));
      },
    );

    await expect(
      convertOfficeToPdf("uploads/source.docx", "output/converted.pdf"),
    ).rejects.toThrow("office2pdf failed");
  });
});