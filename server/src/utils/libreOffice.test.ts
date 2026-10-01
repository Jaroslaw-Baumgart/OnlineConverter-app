import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("child_process", () => ({
  execFile: mocks.execFile,
}));

import {
  LIBRE_OFFICE_PATH,
  LIBRE_OFFICE_TIMEOUT_MS,
} from "./constants";
import {
  convertLibreOfficeToPdf,
  LibreOfficeTimeoutError,
} from "./libreOffice";

type ExecFileCallback = (error: Error | null) => void;

const runExecFileCallback = (error: Error | null) => {
  mocks.execFile.mockImplementation(
    (
      _file: string,
      _arguments: string[],
      _options: object,
      callback: ExecFileCallback,
    ) => {
      callback(error);
    },
  );
};

describe("convertLibreOfficeToPdf", () => {
  it("runs LibreOffice headlessly with an enforced timeout", async () => {
    runExecFileCallback(null);

    await expect(
      convertLibreOfficeToPdf("uploads/document.docx", "output/document.pdf"),
    ).resolves.toBeUndefined();

    expect(mocks.execFile).toHaveBeenCalledWith(
      LIBRE_OFFICE_PATH,
      [
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        "output",
        "uploads/document.docx",
      ],
      {
        timeout: LIBRE_OFFICE_TIMEOUT_MS,
        killSignal: "SIGKILL",
      },
      expect.any(Function),
    );
  });

  it("returns a friendly error when LibreOffice times out", async () => {
    const timeoutError = Object.assign(new Error("Process timed out"), {
      killed: true,
    });
    runExecFileCallback(timeoutError);

    await expect(
      convertLibreOfficeToPdf("uploads/document.docx", "output/document.pdf"),
    ).rejects.toBeInstanceOf(LibreOfficeTimeoutError);
  });
  it("rejects when LibreOffice reports an error", async () => {
    const error = Object.assign(new Error("LibreOffice is unavailable"), {
      code: "ENOENT",
    });
    runExecFileCallback(error);

    await expect(
      convertLibreOfficeToPdf("uploads/document.docx", "output/document.pdf"),
    ).rejects.toBe(error);
  });
});