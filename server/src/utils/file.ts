import fs from "fs/promises";
import path from "path";

export const OUTPUT_RETENTION_MS = 30 * 60 * 1000;

export async function clearFolder(folderPath: string) {
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
    await fs.mkdir(folderPath, { recursive: true });
    console.log(`Cleaned: ${folderPath}`);
  } catch (err) {
    console.error(`Cleaning error ${folderPath}:`, err);
  }
}

export async function clearAllTemp() {
  const uploadsDir = path.join(__dirname, "../../uploads");
  const outputDir = path.join(__dirname, "../../output");
  await Promise.all([clearFolder(uploadsDir), clearFolder(outputDir)]);
}

export const safeUnlink = async (filePath: string) => {
  await fs.unlink(filePath).catch(() => {});
};

export async function cleanupExpiredOutputs(
  outputDirectory: string,
  now = Date.now(),
) {
  let entries;

  try {
    entries = await fs.readdir(outputDirectory, {
      withFileTypes: true,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    throw error;
  }

  for (const entry of entries) {
    const entryPath = path.join(outputDirectory, entry.name);
    const metadata = await fs.stat(entryPath);
    const age = now - metadata.mtimeMs;

    if (age > OUTPUT_RETENTION_MS) {
      await fs.rm(entryPath, {
        recursive: entry.isDirectory(),
        force: true,
      });
    }
  }
}
