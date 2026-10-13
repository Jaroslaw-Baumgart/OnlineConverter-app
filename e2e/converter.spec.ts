import { expect, test } from "@playwright/test";
import path from "node:path";

const fixturePath = (name: string) =>
  path.join(process.cwd(), "e2e", "fixtures", name);

const jpgToPngButton = /JPG.*PNG/;
const pdfToJpgButton = /PDF.*JPG/;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("online-file-converter-language", "en");
  });
});

test("converts a JPG file to PNG through the local server", async ({ page }) => {
  await page.goto("/");

  await page
    .getByLabel("Choose File")
    .setInputFiles(fixturePath("sample.jpg"));
  await page.getByRole("button", { name: jpgToPngButton }).click();
  await page.getByRole("button", { name: "Convert" }).click();

  const downloadButton = page.getByRole("button", { name: "Download file" });

  await expect(downloadButton).toBeVisible();
  await expect(downloadButton).toBeFocused();
  await expect(
    page.getByText("Conversion complete"),
  ).toBeVisible();
});

test("rejects an unsupported file before conversion", async ({ page }) => {
  await page.goto("/");

  await page
    .getByLabel("Choose File")
    .setInputFiles(fixturePath("unsupported.exe"));

  await expect(page.getByRole("alert")).toHaveText(
    /Unsupported file format/,
  );
});

test("shows a safe error when the conversion endpoint fails", async ({ page }) => {
  await page.route("**/convert", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        code: "conversion-failed",
        error: "Test conversion failure",
      }),
    });
  });

  await page.goto("/");
  await page
    .getByLabel("Choose File")
    .setInputFiles(fixturePath("sample.jpg"));
  await page.getByRole("button", { name: jpgToPngButton }).click();
  await page.getByRole("button", { name: "Convert" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "The file could not be converted. Please try again.",
  );
});

test("shows and selects every file returned by a PDF to JPG conversion", async ({
  page,
}) => {
  await page.route("**/convert", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        files: [
          { url: "/output/page-1.jpg", name: "page-1.jpg" },
          { url: "/output/page-2.jpg", name: "page-2.jpg" },
        ],
      }),
    });
  });

  await page.route("**/output/page-*.jpg", async (route) => {
    await route.fulfill({
      contentType: "image/jpeg",
      headers: { "Access-Control-Allow-Origin": "*" },
      path: fixturePath("sample.jpg"),
    });
  });

  await page.goto("/");
  await page
    .getByLabel("Choose File")
    .setInputFiles(fixturePath("two-pages.pdf"));
  await page.getByRole("button", { name: pdfToJpgButton }).click();
  await page.getByRole("button", { name: "Convert" }).click();

  await expect(page.getByRole("button", { name: "Page 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Page 2" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download all" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Page 2" }).click();
  await expect(page.getByText("page-2.jpg")).toBeVisible();
});

test("keeps the converter usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page
    .getByLabel("Choose File")
    .setInputFiles(fixturePath("sample.jpg"));

  await expect(
    page.getByRole("heading", { name: "1. File preview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "2. Convert this file" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: jpgToPngButton })).toBeVisible();

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
