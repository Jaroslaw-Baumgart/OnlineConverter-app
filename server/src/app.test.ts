import request from "supertest";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

vi.mock("./middlewares/routeDispatcher", () => ({
  routeDispatcher: vi.fn(),
}));

import { createApp } from "./app";
import { routeDispatcher } from "./middlewares/routeDispatcher";

let uploadDirectory: string;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  vi.resetAllMocks();

  uploadDirectory = await mkdtemp(
    path.join(tmpdir(), "converter-upload-test-"),
  );
  app = createApp(uploadDirectory);
});

afterEach(async () => {
  await rm(uploadDirectory, { recursive: true, force: true });
});

describe("POST /convert", () => {
  it("rejects a request without a file", async () => {
    const response = await request(app)
      .post("/convert")
      .field("target", "jpg")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: "No file uploaded.",
      code: "conversion-failed",
    });

    expect(routeDispatcher).not.toHaveBeenCalled();
  });

  it("rejects an unsupported file and removes the uploaded file", async () => {
    const response = await request(app)
      .post("/convert")
      .field("target", "jpg")
      .attach("file", Buffer.from("unsupported file content"), {
        filename: "document.exe",
        contentType: "application/octet-stream",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: expect.stringContaining("Invalid file extension."),
      code: "conversion-failed",
    });

    expect(routeDispatcher).not.toHaveBeenCalled();

    expect(await readdir(uploadDirectory)).toEqual([]);
  });

  it("passes a valid uploaded file to the dispatcher", async () => {
    vi.mocked(routeDispatcher).mockImplementationOnce(async (req, res) => {
      res.status(200).json({
        originalName: req.file?.originalname,
        size: req.file?.size,
        target: req.body.target,
      });
    });

    const content = Buffer.from("Example text");

    const response = await request(app)
      .post("/convert")
      .field("target", "pdf")
      .attach("file", content, {
        filename: "document.txt",
        contentType: "text/plain",
      })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(routeDispatcher).toHaveBeenCalledTimes(1);

    expect(response.body).toEqual({
      originalName: "document.txt",
      size: content.length,
      target: "pdf",
    });
  });

  it("rejects an oversized file and removes it", async () => {
    const content = Buffer.alloc(10 * 1024 * 1024 + 1, "a");

    const response = await request(app)
      .post("/convert")
      .field("target", "pdf")
      .attach("file", content, {
        filename: "document.txt",
        contentType: "text/plain",
      })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: "File is too large. Max size: 10 MB",
      code: "conversion-failed",
    });

    expect(routeDispatcher).not.toHaveBeenCalled();
    expect(await readdir(uploadDirectory)).toEqual([]);
  });
});
