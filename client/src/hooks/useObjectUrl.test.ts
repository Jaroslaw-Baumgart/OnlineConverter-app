import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useObjectUrl } from "./useObjectUrl";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useObjectUrl", () => {
  it("revokes previous object URLs after a file change and unmount", () => {
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce("blob:url-a")
      .mockReturnValueOnce("blob:url-b");

    const revokeObjectURL = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });

    const fileA = new File(["a"], "a.png", {
      type: "image/png",
    });

    const fileB = new File(["b"], "b.png", {
      type: "image/png",
    });

    const { result, rerender, unmount } = renderHook(
      ({ file }) => useObjectUrl(file),
      {
        initialProps: {
          file: fileA,
        },
      },
    );

    expect(result.current).toBe("blob:url-a");
    expect(createObjectURL).toHaveBeenCalledWith(fileA);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    rerender({ file: fileB });

    expect(result.current).toBe("blob:url-b");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:url-a");

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:url-b");
  });

  it("returns null without creating an object URL when the file is missing", () => {
    const createObjectURL = vi.fn();
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });

    const { result } = renderHook(() => useObjectUrl(null));

    expect(result.current).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("revokes object URLs created during Strict Mode checks", () => {
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce("blob:strict-a")
      .mockReturnValueOnce("blob:strict-b");

    const revokeObjectURL = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });

    const file = new File(["a"], "a.png", {
      type: "image/png",
    });

    const { result, unmount } = renderHook(() => useObjectUrl(file), {
      reactStrictMode: true,
    });

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:strict-a");
    expect(result.current).toBe("blob:strict-b");

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:strict-b");
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
