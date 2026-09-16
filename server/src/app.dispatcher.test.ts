import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

vi.mock("./controllers/imageController", () => ({
  jpgToPng: vi.fn(),
  pngToJpg: vi.fn(),
  jpgToPdf: vi.fn(),
}));

vi.mock("./controllers/docController", () => ({
  docxToPdf: vi.fn(),
}));

vi.mock("./controllers/pdfController", () => ({
  pdfToTxt: vi.fn(),
  pdfToJpg: vi.fn(),
  txtToPdf: vi.fn(),
}));

import { createApp } from "./app";
import { txtToPdf, pdfToJpg, pdfToTxt } from "./controllers/pdfController";

let uploadDirectory: string;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  vi.resetAllMocks();

  uploadDirectory = await mkdtemp(
    path.join(tmpdir(), "converter-dispatcher-test-"),
  );
  app = createApp(uploadDirectory);
});

afterEach(async () => {
  await rm(uploadDirectory, { recursive: true, force: true });
});

describe("POST /convert with the real dispatcher", () => {
  it("dispatches a TXT upload to the TXT-to-PDF controller", async () => {
    vi.mocked(txtToPdf).mockImplementationOnce(async (_req, res) => {
      res.status(200).json({
        success: true,
        files: [
          {
            name: "converted.pdf",
            url: "/output/converted.pdf",
          },
        ],
      });
    });

    const response = await request(app)
      .post("/convert")
      .field("target", "pdf")
      .attach("file", Buffer.from("Example text"), {
        filename: "document.txt",
        contentType: "text/plain",
      })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(txtToPdf).toHaveBeenCalledTimes(1);

    expect(response.body).toEqual({
      success: true,
      files: [
        {
          name: "converted.pdf",
          url: "/output/converted.pdf",
        },
      ],
    });
  });

  it("rejects an unsupported target for a PDF upload", async () => {
    const content = Buffer.from("%PDF-1.4\n%test fixture\n");

    const response = await request(app)
      .post("/convert")
      .field("target", "png")
      .attach("file", content, {
        filename: "document.pdf",
        contentType: "application/pdf",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: "Please specify target: jpg or txt",
      code: "conversion-failed",
    });

    expect(pdfToJpg).not.toHaveBeenCalled();
    expect(pdfToTxt).not.toHaveBeenCalled();
    expect(txtToPdf).not.toHaveBeenCalled();
  });
});
