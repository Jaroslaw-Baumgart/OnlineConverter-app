import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DownloadSection from "./DownloadSection";

const renderDownloadSection = (file: File, url: string) => {
  render(
    <DownloadSection
      convertedFile={url}
      convertedPreviewFile={file}
      onDownload={vi.fn()}
    />,
  );
};

describe("DownloadSection", () => {
  it.each([
    ["converted.png", "image/png", "https://example.com/converted.png"],
    ["converted.jpg", "image/jpeg", "https://example.com/converted.jpg"],
  ])("renders an image preview for %s", (fileName, mimeType, url) => {
    const file = new File(["image content"], fileName, {
      type: mimeType,
    });

    renderDownloadSection(file, url);

    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
      "src",
      url,
    );
  });

  it("renders a PDF preview for a PDF result", () => {
    const file = new File(["pdf content"], "converted.pdf", {
      type: "application/pdf",
    });

    renderDownloadSection(file, "https://example.com/converted.pdf");

    expect(screen.getByTitle("PDF Preview")).toHaveAttribute(
      "src",
      "https://example.com/converted.pdf",
    );
  });

  it("renders a text preview for a text result", async () => {
    const file = new File(["converted text"], "converted.txt", {
      type: "text/plain",
    });

    renderDownloadSection(file, "https://example.com/converted.txt");

    expect(
      await screen.findByDisplayValue("converted text"),
    ).toBeInTheDocument();
  });

  it("renders guidance for a DOCX result", () => {
    const file = new File(["docx content"], "converted.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    renderDownloadSection(file, "https://example.com/converted.docx");

    expect(
      screen.getByText(
        "To preview Word documents, please convert them to PDF first",
      ),
    ).toBeInTheDocument();
  });

  it("renders an unsupported preview with the MIME type", () => {
    const file = new File(["binary content"], "converted.bin", {
      type: "application/octet-stream",
    });

    renderDownloadSection(file, "https://example.com/converted.bin");

    expect(
      screen.getByText("Preview not available for this file type"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Type: application/octet-stream"),
    ).toBeInTheDocument();
  });

  it("renders an error when an image preview fails to load", () => {
    const file = new File(["image content"], "converted.png", {
      type: "image/png",
    });

    renderDownloadSection(file, "https://example.com/converted.png");

    const image = screen.getByRole("img", {
      name: "Preview",
    });

    fireEvent.error(image);

    expect(
      screen.getByText("Failed to load image preview"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("img", { name: "Preview" }),
    ).not.toBeInTheDocument();
  });
});
