import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../test/server";
import { fetchConvertedFile, requestConversion } from "./conversionClient";

describe("requestConversion", () => {
  it("posts the conversion form data to the configured endpoint", async () => {
    expect.assertions(2);

    const formData = new FormData();
    formData.append("conversionType", "jpg-to-png");

    server.use(
      http.post("http://localhost:5000/convert", async ({ request }) => {
        const receivedFormData = await request.formData();

        expect(receivedFormData.get("conversionType")).toBe("jpg-to-png");

        return HttpResponse.json({
          success: true,
          files: [
            {
              url: "/output/converted.png",
              name: "converted.png",
            },
          ],
        });
      }),
    );

    const response = await requestConversion(formData);

    expect(response.ok).toBe(true);
  });
});

describe("fetchConvertedFile", () => {
  it("gets a converted file from a relative URL", async () => {
    server.use(
      http.get("http://localhost:5000/output/converted.png", () => {
        return new HttpResponse("converted content", {
          headers: {
            "Content-Type": "image/png",
          },
        });
      }),
    );

    const response = await fetchConvertedFile("/output/converted.png");

    expect(response.ok).toBe(true);
    expect(await response.text()).toBe("converted content");
  });
});
