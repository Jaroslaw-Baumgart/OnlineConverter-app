import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const getEnabledConvertButton = (): HTMLElement => {
  const button = screen
    .getAllByRole("button", { name: "Convert" })
    .find((candidate) => !candidate.hasAttribute("disabled"));

  if (!button) {
    throw new Error("No enabled conversion button was found");
  }

  return button;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("returns to the initial state after removing the selected file", async () => {
    const user = userEvent.setup();

    render(<App />);

    const input = screen.getByLabelText("Choose File");
    const file = new File(["content"], "image.png", {
      type: "image/png",
    });

    await user.upload(input, file);

    expect(screen.getByText("image.png")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove file" }));

    expect(screen.getByText("No file chosen")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove file" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Preview" }),
    ).not.toBeInTheDocument();

    for (const button of screen.getAllByRole("button", { name: "Convert" })) {
      expect(button).toBeDisabled();
    }

    await user.upload(input, file);

    expect(screen.getByText("image.png")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove file" }),
    ).toBeInTheDocument();
  });

  it("clears a conversion error after removing the selected file", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);

    const input = screen.getByLabelText("Choose File");
    const file = new File(["content"], "image.jpg", {
      type: "image/jpeg",
    });

    await user.upload(input, file);

    const enabledConvertButton = getEnabledConvertButton();

    await user.click(enabledConvertButton);

    expect(
      await screen.findByText("Error converting file"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove file" }));

    expect(screen.queryByText("Error converting file")).not.toBeInTheDocument();
  });

  it("clears the conversion result after removing the selected file", async () => {
    const user = userEvent.setup();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filename: "Converted.png" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () =>
          new Blob(["converted content"], {
            type: "image/png",
          }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const input = screen.getByLabelText("Choose File");
    const file = new File(["content"], "image.jpg", {
      type: "image/jpeg",
    });

    await user.upload(input, file);

    const enabledConvertButton = getEnabledConvertButton();

    await user.click(enabledConvertButton);

    expect(
      await screen.findByRole("heading", {
        name: "Download Converted File",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove file" }));

    expect(
      screen.queryByRole("heading", {
        name: "Download Converted File",
      }),
    ).not.toBeInTheDocument();
  });
});
