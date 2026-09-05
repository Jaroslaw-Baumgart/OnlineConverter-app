import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import PdfPageControls from "./PdfPageControls";

const setup = (disabled = false) => {
  const onConvert = vi.fn();
  const user = userEvent.setup();

  render(<PdfPageControls disabled={disabled} onConvert={onConvert} />);

  return { user, onConvert };
};

describe("PdfPageControls", () => {
  it("reveals portrait as the default orientation", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: "Customize output",
      }),
    );

    expect(
      screen.getByRole("radio", {
        name: "Portrait",
      }),
    ).toBeChecked();

    expect(
      screen.getByRole("radio", {
        name: "Landscape",
      }),
    ).not.toBeChecked();
  });

  it("submits the default orientation without opening settings", async () => {
    const { user, onConvert } = setup();

    await user.click(
      screen.getByRole("button", {
        name: "Convert",
      }),
    );

    expect(onConvert.mock.calls[0]?.[0]).toEqual({
      pageOrientation: "portrait",
    });
  });

  it("submits landscape orientation", async () => {
    const { user, onConvert } = setup();

    await user.click(
      screen.getByRole("button", {
        name: "Customize output",
      }),
    );

    await user.click(
      screen.getByRole("radio", {
        name: "Landscape",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Convert",
      }),
    );

    expect(onConvert.mock.calls[0]?.[0]).toEqual({
      pageOrientation: "landscape",
    });
  });

  it("disables conversion when requested by the parent", () => {
    setup(true);

    expect(
      screen.getByRole("button", {
        name: "Convert",
      }),
    ).toBeDisabled();
  });
});
