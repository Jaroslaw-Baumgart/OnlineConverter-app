import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../test/server";
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

const createTestFile = {
  pdf: (name = "document.pdf") =>
    new File(["pdf content"], name, {
      type: "application/pdf",
    }),

  png: (name = "image.png") =>
    new File(["png content"], name, {
      type: "image/png",
    }),

  jpg: (name = "image.jpg") =>
    new File(["jpg content"], name, {
      type: "image/jpeg",
    }),

  txt: (name = "document.txt") =>
    new File(["text content"], name, {
      type: "text/plain",
    }),

  docx: (name = "document.docx") =>
    new File(["docx content"], name, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
};

const setupFileConverter = () => {
  const user = userEvent.setup();

  render(<FileConverter conversionOptions={conversionOptions} />);

  return {
    user,
    input: screen.getByLabelText("Choose File"),
  };
};

describe("FileConverter", () => {
  it("disables all conversion buttons when no file is selected", () => {
    setupFileConverter();

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
    async (fileName) => {
      const file = createTestFile.pdf(fileName);

      const { user, input } = setupFileConverter();

      await user.upload(input, file);

      expect(screen.getByTitle("PDF Preview")).toBeInTheDocument();

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

  it("enables only conversions allowed for a PNG file", async () => {
    const file = createTestFile.png();
    const { user, input } = setupFileConverter();

    await user.upload(input, file);

    expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();

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

  it("updates available conversions when the selected file changes", async () => {
    const pdfFile = createTestFile.pdf();
    const pngFile = createTestFile.png();

    const { user, input } = setupFileConverter();

    await user.upload(input, pdfFile);

    expect(getConvertButton("PDF→JPG")).toBeEnabled();
    expect(getConvertButton("PNG→JPG")).toBeDisabled();

    await user.upload(input, pngFile);

    expect(getConvertButton("PDF→JPG")).toBeDisabled();
    expect(getConvertButton("PNG→JPG")).toBeEnabled();
  });

  it("clears the previous conversion result when a new file is selected", async () => {
    const initialFile = createTestFile.jpg();
    const newFile = createTestFile.pdf();

    server.use(
      http.post("http://localhost:5000/convert", () => {
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

      http.get("http://localhost:5000/output/converted.png", () => {
        return new HttpResponse("converted content", {
          headers: {
            "Content-Type": "image/png",
          },
        });
      }),
    );

    const { user, input } = setupFileConverter();

    await user.upload(input, initialFile);

    await user.click(getConvertButton("JPG→PNG"));

    expect(
      await screen.findByRole("heading", {
        name: "Download Converted File",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Download File" }),
    ).toBeInTheDocument();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(getConvertButton("JPG→PNG")).toBeEnabled();

    await user.upload(input, newFile);

    expect(
      screen.queryByRole("heading", {
        name: "Download Converted File",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("renders a text preview for a TXT file", async () => {
    const file = createTestFile.txt();
    const { user, input } = setupFileConverter();

    await user.upload(input, file);

    expect(await screen.findByDisplayValue("text content")).toBeInTheDocument();
  });

  it("renders guidance for a DOCX file", async () => {
    const file = createTestFile.docx();
    const { user, input } = setupFileConverter();

    await user.upload(input, file);

    expect(
      screen.getByText(
        "To preview Word documents, please convert them to PDF first",
      ),
    ).toBeInTheDocument();
  });

  it("shows the conversion error returned by the backend", async () => {
    server.use(
      http.post("http://localhost:5000/convert", () => {
        return HttpResponse.json(
          {
            success: false,
            error: "Unsupported conversion",
          },
          { status: 400 },
        );
      }),
    );

    const { user, input } = setupFileConverter();

    await user.upload(input, createTestFile.jpg());
    await user.click(getConvertButton("JPG→PNG"));

    expect(
      await screen.findByText("Unsupported conversion"),
    ).toBeInTheDocument();
  });

  it("show a loading state while conversion is in progress", async () => {
    let finishRequest: (() => void) | undefined;

    const requestGate = new Promise<void>((resolve) => {
      finishRequest = resolve;
    });

    server.use(
      http.post("http://localhost:5000/convert", async () => {
        await requestGate;

        return HttpResponse.json(
          {
            success: false,
            error: "Test conversion stopped",
          },
          { status: 500 },
        );
      }),
    );

    const { user, input } = setupFileConverter();

    await user.upload(input, createTestFile.jpg());
    await user.click(getConvertButton("JPG→PNG"));

    expect(screen.getByRole("status")).toHaveTextContent("Converting");

    finishRequest?.();

    expect(
      await screen.findByText("Test conversion stopped"),
    ).toBeInTheDocument();
  });

  it("sends only one request when Convert is clicked repeatedly", async () => {
    let requestCount = 0;
    let finishRequest: (() => void) | undefined;

    const requestGate = new Promise<void>((resolve) => {
      finishRequest = resolve;
    });

    server.use(
      http.post("http://localhost:5000/convert", async () => {
        requestCount += 1;
        await requestGate;

        return HttpResponse.json(
          {
            success: false,
            error: "Test conversion stopped",
          },
          { status: 500 },
        );
      }),
    );

    const { user, input } = setupFileConverter();

    await user.upload(input, createTestFile.jpg());

    const convertButton = getConvertButton("JPG→PNG");

    await user.dblClick(convertButton);

    expect(convertButton).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Converting");
    expect(requestCount).toBe(1);

    finishRequest?.();

    expect(
      await screen.findByText("Test conversion stopped"),
    ).toBeInTheDocument();
  });

  it("shows an error when the backend returns an invalid response", async () => {
    server.use(
      http.post("http://localhost:5000/convert", async () => {
        return HttpResponse.json({
          success: true,
          files: [],
        });
      }),
    );

    vi.spyOn(console, "error").mockImplementation(() => {});

    const { user, input } = setupFileConverter();

    await user.upload(input, createTestFile.jpg());
    await user.click(getConvertButton("JPG→PNG"));

    expect(
      await screen.findByText("Error converting file"),
    ).toBeInTheDocument();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    expect(getConvertButton("JPG→PNG")).toBeEnabled();

    expect(
      screen.queryByRole("heading", {
        name: "Download Converted File",
      }),
    ).not.toBeInTheDocument();
  });
});
