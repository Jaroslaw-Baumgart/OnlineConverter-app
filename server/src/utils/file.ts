import fs from "fs/promises";
import path from "path";


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
const outputDir  = path.join(__dirname, "../../output");
  await Promise.all([clearFolder(uploadsDir), clearFolder(outputDir)]);
}

export const safeUnlink = (filePath: string) => {
  setTimeout(() => {
    fs.unlink(filePath).catch(() => {});
  }, 300);
};
