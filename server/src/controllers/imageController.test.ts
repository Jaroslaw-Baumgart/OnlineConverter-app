import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sharpMocks = vi.hoisted(() => {
  const toFile = vi.fn().mockResolvedValue(undefined);
  const jpeg = vi.fn(() => ({ toFile }));
  const flatten = vi.fn(() => ({ jpeg }));
  const sharp = vi.fn(() => ({ flatten }));
  const safeUnlink = vi.fn();

  return {
    sharp,
    flatten,
    jpeg,
    toFile,
    safeUnlink,
  };
});

vi.mock("sharp", () => ({
  default: sharpMocks.sharp,
}));

vi.mock("../utils/file", () => ({
  safeUnlink: sharpMocks.safeUnlink,
}));

import { pngToJpg } from "./imageController";

const createRequest = (body: unknown): Request =>
  ({
    body,
    file: {
      path: "uploads/image.png",
      filename: "image.png",
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

describe("pngToJpg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes validated settings to Sharp", async () => {
    const request = createRequest({
      quality: "95",
      backgroundColor: "#000000",
    });
    const { response, status } = createResponse();

    await pngToJpg(request, response);

    expect(sharpMocks.sharp).toHaveBeenCalledWith("uploads/image.png");
    expect(sharpMocks.flatten).toHaveBeenCalledWith({
      background: "#000000",
    });
    expect(sharpMocks.jpeg).toHaveBeenCalledWith({
      quality: 95,
    });
    expect(sharpMocks.toFile).toHaveBeenCalledWith(
      expect.stringMatching(/image\.jpg$/),
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(sharpMocks.safeUnlink).toHaveBeenCalledWith("uploads/image.png");
  });

  it("rejects invalid settings without starting Sharp", async () => {
    const request = createRequest({
      quality: "101",
      backgroundColor: "#ffffff",
    });
    const { response, status, json } = createResponse();

    await pngToJpg(request, response);

    expect(sharpMocks.sharp).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid conversion settings.",
      code: "conversion-failed",
    });
    expect(sharpMocks.safeUnlink).toHaveBeenCalledWith("uploads/image.png");
  });
});
