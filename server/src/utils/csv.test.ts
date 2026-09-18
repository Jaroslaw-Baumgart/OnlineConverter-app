import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses headers, quoted separators and Polish characters", async () => {
    const fixturePath = path.join(
      process.cwd(),
      "src",
      "fixtures",
      "sample.csv",
    );
    const csv = await readFile(fixturePath, "utf8");

    expect(parseCsv(csv)).toEqual([
      {
        Imię: "Łukasz",
        "Nazwa produktu": "Kawa, duża",
        Ilość: "2",
        Opis: "Napój z mlekiem",
      },
      {
        Imię: "Anna",
        "Nazwa produktu": "Herbata",
        Ilość: "1",
        Opis: "Bez cukru",
      },
    ]);
  });

  it("rejects malformed CSV", () => {
    expect(() => parseCsv("Imię,Nazwa\nŁukasz")).toThrow(
      "Invalid CSV data.",
    );
  });
});