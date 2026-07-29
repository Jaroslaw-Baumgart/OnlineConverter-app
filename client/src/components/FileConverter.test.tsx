import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FileConverter from "./FileConverter";
import type { ConversionOption } from "../types/converter";

const conversionOptions: ConversionOption[] = [
  {
    id: "pdf-to-jpg",
    label: "PDF to JPG",
    from: "PDF",
    to: "JPG",
  },
  {
    id: "jpg-to-png",
    label: "JPG to PNG",
    from: "JPG",
    to: "PNG",
  },
  {
    id: "pdf-to-txt",
    label: "PDF to TXT",
    from: "PDF",
    to: "TXT",
  },
  {
    id: "png-to-jpg",
    label: "PNG to JPG",
    from: "PNG",
    to: "JPG",
  },
];

const getOptionCard = (text: string): HTMLElement => {
  const optionText = screen.getByText((_, element) => {
    return (
      element?.classList.contains("option-text") === true &&
      element.textContent === text
    );
  });

  const optionCard = optionText.closest(".option-card");

  if (!(optionCard instanceof HTMLElement)) {
    throw new Error(`Option card "${text}" was not found`);
  }

  return optionCard;
};

const getConvertButton = (optionText: string) =>
  within(getOptionCard(optionText)).getByRole("button", {
    name: "Convert",
  });

describe("FileConverter", () => {
  it("disables all conversion buttons when no file is selected", () => {
    render(
      <FileConverter
        file={null}
        convertedFile={null}
        setConvertedFile={vi.fn()}
        onFileUpload={vi.fn()}
        conversionOptions={conversionOptions}
      />,
    );

    const convertButtons = screen.getAllByRole("button", {
      name: "Convert",
    });

    expect(convertButtons).toHaveLength(conversionOptions.length);

    for (const button of convertButtons) {
      expect(button).toBeDisabled();
    }
  });

  it.each(["document.pdf", "document.PDF"])(
    "enables only conversions allowed for PDF file %s",
    (fileName) => {
      const file = new File(["content"], fileName, {
        type: "application/pdf",
      });

      render(
        <FileConverter
          file={file}
          convertedFile={null}
          setConvertedFile={vi.fn()}
          onFileUpload={vi.fn()}
          conversionOptions={conversionOptions}
        />,
      );

      const pdfToJpgCard = getOptionCard("PDF→JPG");
      const pdfToTxtCard = getOptionCard("PDF→TXT");
      const jpgToPngCard = getOptionCard("JPG→PNG");

      expect(
        within(pdfToJpgCard).getByRole("button", { name: "Convert" }),
      ).toBeEnabled();

      expect(
        within(pdfToTxtCard).getByRole("button", { name: "Convert" }),
      ).toBeEnabled();

      expect(
        within(jpgToPngCard).getByRole("button", { name: "Convert" }),
      ).toBeDisabled();
    },
  );

  it("enables only conversions allowed for a PNG file", () => {
    const file = new File(["content"], "image.png", {
      type: "image/png",
    });

    render(
      <FileConverter
        file={file}
        convertedFile={null}
        setConvertedFile={vi.fn()}
        onFileUpload={vi.fn()}
        conversionOptions={conversionOptions}
      />,
    );

    const pdfToJpgCard = getOptionCard("PDF→JPG");
    const jpgToPngCard = getOptionCard("JPG→PNG");
    const pdfToTxtCard = getOptionCard("PDF→TXT");
    const pngToJpgCard = getOptionCard("PNG→JPG");

    expect(
      within(pdfToJpgCard).getByRole("button", { name: "Convert" }),
    ).toBeDisabled();

    expect(
      within(pdfToTxtCard).getByRole("button", { name: "Convert" }),
    ).toBeDisabled();

    expect(
      within(jpgToPngCard).getByRole("button", { name: "Convert" }),
    ).toBeDisabled();

    expect(
      within(pngToJpgCard).getByRole("button", { name: "Convert" }),
    ).toBeEnabled();
  });

  it("disables all conversions for an unsupported file", () => {
    const file = new File(["content"], "archive.xyz", {
      type: "application/octet-stream",
    });

    render(
      <FileConverter
        file={file}
        convertedFile={null}
        setConvertedFile={vi.fn()}
        onFileUpload={vi.fn()}
        conversionOptions={conversionOptions}
      />,
    );

    const convertButtons = screen.getAllByRole("button", {
      name: "Convert",
    });

    expect(convertButtons).toHaveLength(conversionOptions.length);

    for (const button of convertButtons) {
      expect(button).toBeDisabled();
    }
  });

  it("updates available conversions when the selected file changes", () => {
    const pdfFile = new File(["pdf content"], "document.pdf", {
      type: "application/pdf",
    });

    const pngFile = new File(["png content"], "image.png", {
      type: "image/png",
    });

    const commonProps = {
      convertedFile: null,
      setConvertedFile: vi.fn(),
      onFileUpload: vi.fn(),
      conversionOptions,
    };

    const { rerender } = render(
      <FileConverter file={pdfFile} {...commonProps} />,
    );

    expect(getConvertButton("PDF→JPG")).toBeEnabled();
    expect(getConvertButton("PNG→JPG")).toBeDisabled();

    rerender(<FileConverter file={pngFile} {...commonProps} />);

    expect(getConvertButton("PDF→JPG")).toBeDisabled();
    expect(getConvertButton("PNG→JPG")).toBeEnabled();
  });
});
