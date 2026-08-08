import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FilePreview from "./FilePreview";

describe("FilePreview", () => {
  it("renders an image preview", () => {
    render(
      <FilePreview
        preview={{
          kind: "image",
          url: "https://example.com/converted.jpg",
        }}
      />,
    );

    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
      "src",
      "https://example.com/converted.jpg",
    );
  });

  it("renders a PDF preview", () => {
    render(
      <FilePreview
        preview={{
          kind: "pdf",
          url: "https://example.com/converted.pdf",
        }}
      />,
    );

    expect(screen.getByTitle("PDF Preview")).toHaveAttribute(
      "src",
      "https://example.com/converted.pdf",
    );
  });

  it("renders a text preview", async () => {
    const file = new File(["text content"], "document.txt", {
      type: "text/plain",
    });

    render(
      <FilePreview
        preview={{
          kind: "text",
          file,
          isLoading: false,
        }}
      />,
    );

    expect(await screen.findByDisplayValue("text content")).toBeInTheDocument();
  });

  it("renders Word preview guidance", () => {
    render(
      <FilePreview
        preview={{
          kind: "word",
        }}
      />,
    );

    expect(
      screen.getByText(
        "To preview Word documents, please convert them to PDF first",
      ),
    ).toBeInTheDocument();
  });

  it("renders an unsupported file message", () => {
    render(
      <FilePreview
        preview={{
          kind: "unsupported",
          fileType: "application/octet-stream",
        }}
      />,
    );

    expect(
      screen.getByText("Preview not available for this file type"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Type: application/octet-stream"),
    ).toBeInTheDocument();
  });
});
