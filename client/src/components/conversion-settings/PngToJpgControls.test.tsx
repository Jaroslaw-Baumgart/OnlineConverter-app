import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import PngToJpgControls from "./PngToJpgControls";

describe("PngToJpgControls", () => {
  it("reveals output settings with their default values", async () => {
    const user = userEvent.setup();

    render(<PngToJpgControls disabled={false} onConvert={vi.fn()} />);

    expect(screen.queryByLabelText("Quality")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Customize output",
      }),
    );

    expect(screen.getByLabelText("Quality")).toHaveValue(85);

    expect(screen.getByLabelText("Replace transparent areas with")).toHaveValue(
      "#ffffff",
    );
  });

  it("submits the default settings without opening the panel", async () => {
    const user = userEvent.setup();
    const onConvert = vi.fn();

    render(<PngToJpgControls disabled={false} onConvert={onConvert} />);

    await user.click(
      screen.getByRole("button", {
        name: "Convert",
      }),
    );

    expect(onConvert.mock.calls[0]?.[0]).toEqual({
      quality: 85,
      backgroundColor: "#ffffff",
    });
  });

  it("submits customized output settings", async () => {
    const user = userEvent.setup();
    const onConvert = vi.fn();

    render(<PngToJpgControls disabled={false} onConvert={onConvert} />);

    await user.click(
      screen.getByRole("button", {
        name: "Customize output",
      }),
    );

    const qualityInput = screen.getByLabelText("Quality");

    await user.clear(qualityInput);
    await user.type(qualityInput, "95");

    fireEvent.change(screen.getByLabelText("Replace transparent areas with"), {
      target: {
        value: "#000000",
      },
    });

    await user.click(
      screen.getByRole("button", {
        name: "Convert",
      }),
    );

    expect(onConvert.mock.calls[0]?.[0]).toEqual({
      quality: 95,
      backgroundColor: "#000000",
    });
  });

  it("shows an error and does not convert when quality is invalid", async () => {
    const user = userEvent.setup();
    const onConvert = vi.fn();

    render(<PngToJpgControls disabled={false} onConvert={onConvert} />);

    await user.click(
      screen.getByRole("button", {
        name: "Customize output",
      }),
    );

    const qualityInput = screen.getByLabelText("Quality");

    await user.clear(qualityInput);
    await user.type(qualityInput, "0");

    await user.click(
      screen.getByRole("button", {
        name: "Convert",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Quality must be between 1 and 100.",
    );

    expect(onConvert).not.toHaveBeenCalled();
  });
});
