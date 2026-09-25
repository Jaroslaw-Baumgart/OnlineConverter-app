import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import userEvent from "@testing-library/user-event";

import FilePreview from "./FilePreview";
import * as xlsxUtils from "../utils/xlsx";
import { renderAsync } from "docx-preview";

vi.mock("docx-preview", () => ({
  renderAsync: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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

  it("renders a DOCX preview container", () => {
    const file = new File([], "document.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    render(
      <FilePreview
        preview={{
          kind: "word",
          file,
          isLoading: false,
        }}
      />,
    );

    expect(screen.getByTestId("docx-preview")).toBeInTheDocument();
  });

  it("shows an error when DOCX rendering fails", async () => {
    vi.mocked(renderAsync).mockRejectedValueOnce(
      new Error("Invalid DOCX file"),
    );

    const file = new File(["broken content"], "broken.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    render(
      <FilePreview
        preview={{
          kind: "word",
          file,
          isLoading: false,
        }}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to render DOCX content",
    );
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

  it("renders parsed CSV rows as a table", async () => {
    const file = new File(["Name,Amount\nAnna,2\nJan,5"], "payments.csv", {
      type: "text/csv",
    });

    render(
      <FilePreview
        preview={{
          kind: "csv",
          file,
          isLoading: false,
        }}
      />,
    );

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Amount" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Anna" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2" })).toBeInTheDocument();
  });

  it("shows sheet names after loading an XLSX file", async () => {
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["Produkt"], ["Kawa"]]),
      "Sprzedaż",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["Status"], ["Gotowe"]]),
      "Podsumowanie",
    );

    const bytes = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const file = new File([bytes], "report.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    render(
      <FilePreview
        preview={{
          kind: "xlsx",
          file,
          isLoading: false,
        }}
      />,
    );

    expect(await screen.findByText("Sprzedaż")).toBeInTheDocument();
    expect(await screen.findByText("Podsumowanie")).toBeInTheDocument();
  });

  it("ignores an earlier XLSX result after changing files", async () => {
    let finishFirst!: (sheets: xlsxUtils.XlsxSheet[]) => void;
    let finishSecond!: (sheets: xlsxUtils.XlsxSheet[]) => void;

    const firstRead = new Promise<xlsxUtils.XlsxSheet[]>((resolve) => {
      finishFirst = resolve;
    });

    const secondRead = new Promise<xlsxUtils.XlsxSheet[]>((resolve) => {
      finishSecond = resolve;
    });

    const parseSpy = vi
      .spyOn(xlsxUtils, "parseXlsxFile")
      .mockReturnValueOnce(firstRead)
      .mockReturnValueOnce(secondRead);

    try {
      const { rerender } = render(
        <FilePreview
          preview={{
            kind: "xlsx",
            file: new File([], "first.xlsx"),
            isLoading: false,
          }}
        />,
      );

      rerender(
        <FilePreview
          preview={{
            kind: "xlsx",
            file: new File([], "second.xlsx"),
            isLoading: false,
          }}
        />,
      );

      await act(async () => {
        finishSecond([{ name: "Current sheet", rows: [["B"]] }]);
        await secondRead;
      });

      expect(screen.getByText("Current sheet")).toBeInTheDocument();

      await act(async () => {
        finishFirst([{ name: "Old sheet", rows: [["A"]] }]);
        await firstRead;
      });

      expect(screen.getByText("Current sheet")).toBeInTheDocument();
      expect(screen.queryByText("Old sheet")).not.toBeInTheDocument();
    } finally {
      parseSpy.mockRestore();
    }
  });

  it("displays the first sheet and allows switching sheets", async () => {
    const user = userEvent.setup();
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ["Produkt", "Ilość"],
        ["Kawa", 2],
      ]),
      "Sprzedaż",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ["Miasto", "Stan"],
        ["Warszawa", 15],
      ]),
      "Magazyn",
    );

    const bytes = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const file = new File([bytes], "report.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    render(
      <FilePreview
        preview={{
          kind: "xlsx",
          file,
          isLoading: false,
        }}
      />,
    );

    const firstSheetButton = await screen.findByRole("button", {
      name: "Sprzedaż",
    });

    expect(firstSheetButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Kawa" })).toBeInTheDocument();
    expect(
      screen.queryByRole("cell", { name: "Warszawa" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Magazyn" }));

    expect(screen.getByRole("button", { name: "Magazyn" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    expect(firstSheetButton).toHaveAttribute("aria-pressed", "false");

    expect(screen.getByRole("cell", { name: "Warszawa" })).toBeInTheDocument();
    expect(
      screen.queryByRole("cell", { name: "Kawa" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Charts are not shown in this preview. To view them, convert the file to PDF using the charts option.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "A" })).toBeInTheDocument();

    expect(screen.getByRole("columnheader", { name: "B" })).toBeInTheDocument();
  });

  it("shows an empty sheet message and allows selecting another sheet", async () => {
    const user = userEvent.setup();
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([]),
      "Pusty",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["Kawa"]]),
      "Dane",
    );

    const bytes = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const file = new File([bytes], "report.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    render(
      <FilePreview
        preview={{
          kind: "xlsx",
          file,
          isLoading: false,
        }}
      />,
    );

    expect(await screen.findByText("This sheet is empty.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dane" }));

    expect(screen.getByRole("cell", { name: "Kawa" })).toBeInTheDocument();
    expect(screen.queryByText("This sheet is empty.")).not.toBeInTheDocument();
  });

  it("limits the XLSX preview to the first 100 rows", async () => {
    const workbook = XLSX.utils.book_new();
    const rows = Array.from({ length: 105 }, (_, index) => [
      `Wiersz ${index + 1}`,
    ]);

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      "Dane",
    );

    const bytes = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    const file = new File([bytes], "large.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    render(
      <FilePreview
        preview={{
          kind: "xlsx",
          file,
          isLoading: false,
        }}
      />,
    );

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(101);
    expect(
      screen.getByRole("cell", { name: "Wiersz 100" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("cell", { name: "Wiersz 101" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Showing first 100 of 105 rows."),
    ).toBeInTheDocument();
  });

  it("renders DOCX content inside the preview container", async () => {
    const file = new File(["docx content"], "document.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    render(
      <FilePreview
        preview={{
          kind: "word",
          file,
          isLoading: false,
        }}
      />,
    );

    await waitFor(() => {
      expect(renderAsync).toHaveBeenCalledTimes(1);
    });

    expect(renderAsync).toHaveBeenCalledWith(
      expect.anything(),
      screen.getByTestId("docx-preview"),
    );
  });
});
