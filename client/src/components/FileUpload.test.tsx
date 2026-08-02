import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FileUpload from "./FileUpload";

describe("FileUpload", () => {
  it("rejects a file with an unsupported extension", async () => {
    const user = userEvent.setup({
      applyAccept: false,
    });

    const onFileSelect = vi.fn();

    render(<FileUpload file={null} onFileSelect={onFileSelect} />);

    const input = screen.getByLabelText("Choose File");

    const unsupportedFile = new File(["content"], "photo.exe", {
      type: "application/octet-stream",
    });

    await user.upload(input, unsupportedFile);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unsupported file format. Supported formats: PDF, JPG, PNG, TXT, DOCX.",
    );

    expect(onFileSelect).not.toHaveBeenCalled();
  });
});
