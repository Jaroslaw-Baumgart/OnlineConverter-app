import { describe, expect, it, vi } from "vitest";

import { sendErrorResponse, sendSuccessResponse } from "./response";

const createResponseMock = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response;
};

describe("sendResponse", () => {
  it("sends a successful conversion response", () => {
    const response = createResponseMock();

    sendSuccessResponse(response, [
      {
        url: "/output/converted.png",
        name: "converted.png",
      },
    ]);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      files: [
        {
          url: "/output/converted.png",
          name: "converted.png",
        },
      ],
    });
  });

  it.each([
    [400, "No file uploaded"],
    [500, "Conversion failed"],
  ] as const)("sends status %i with error: %s", (status, error) => {
    const response = createResponseMock();

    sendErrorResponse(response, status, error);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error,
    });
  });
});
