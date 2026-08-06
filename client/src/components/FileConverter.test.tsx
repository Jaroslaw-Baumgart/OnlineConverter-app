import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { conversions as conversionOptions } from "../config/conversions";
import FileConverter from "./FileConverter";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FileConverter", () => {
  it("disables all conversion buttons when no file is selected", () => {
    render(
      <FileConverter
        file={null}
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

  it("clears the previous conversion result when a new file is selected", async () => {
    const user = userEvent.setup();

    const initialFile = new File(["jpg content"], "image.jpg", {
      type: "image/jpeg",
    });

    const newFile = new File(["pdf content"], "document.pdf", {
      type: "application/pdf",
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filename: "converted.png" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () =>
          new Blob(["converted content"], {
            type: "image/png",
          }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const onFileUpload = vi.fn();

    render(
      <FileConverter
        file={initialFile}
        onFileUpload={onFileUpload}
        conversionOptions={conversionOptions}
      />,
    );

    await user.click(getConvertButton("JPG→PNG"));

    expect(
      await screen.findByRole("heading", {
        name: "Download Converted File",
      }),
    ).toBeInTheDocument();

    const input = screen.getByLabelText("Choose File");

    await user.upload(input, newFile);

    expect(
      screen.queryByRole("heading", {
        name: "Download Converted File",
      }),
    ).not.toBeInTheDocument();

    expect(onFileUpload).toHaveBeenCalledWith(newFile);
  });
});
