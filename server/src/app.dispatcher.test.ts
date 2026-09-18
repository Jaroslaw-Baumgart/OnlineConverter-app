import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import fsSync from "node:fs";

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
      .field("conversionType", "txt-to-pdf")
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

  it("rejects an unsupported conversion type for a PDF upload", async () => {
    const content = Buffer.from("%PDF-1.4\n%test fixture\n");

    const response = await request(app)
      .post("/convert")
      .field("conversionType", "pdf-to-png")
      .attach("file", content, {
        filename: "document.pdf",
        contentType: "application/pdf",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: "Unsupported conversion type.",
      code: "conversion-failed",
    });

    expect(pdfToJpg).not.toHaveBeenCalled();
    expect(pdfToTxt).not.toHaveBeenCalled();
    expect(txtToPdf).not.toHaveBeenCalled();
  });

  it("rejects an unknown conversion type", async () => {
    const response = await request(app)
      .post("/convert")
      .field("conversionType", "banana-to-pdf")
      .attach("file", Buffer.from("Example text"), {
        filename: "document.txt",
        contentType: "text/plain",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Unsupported conversion type.");
    expect(txtToPdf).not.toHaveBeenCalled();
  });

  it("rejects a conversion type that does not match the uploaded file", async () => {
    const response = await request(app)
      .post("/convert")
      .field("conversionType", "jpg-to-pdf")
      .attach("file", Buffer.from("Example text"), {
        filename: "document.txt",
        contentType: "text/plain",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: "File type does not match conversion type.",
      code: "conversion-failed",
    });

    expect(txtToPdf).not.toHaveBeenCalled();
  });

  it("dispatches a CSV upload to the CSV-to-PDF controller", async () => {
    const response = await request(app)
      .post("/convert")
      .field("conversionType", "csv-to-pdf")
      .attach(
        "file",
        fsSync.readFileSync(path.resolve(__dirname, "fixtures/sample.csv")),
        {
          filename: "sample.csv",
          contentType: "text/csv",
        },
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.stringMatching(/\.pdf$/),
        }),
      ]),
    );
  });
});
