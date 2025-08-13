import fs from "fs/promises";

export const safeUnlink = (filePath: string) => {
  setTimeout(() => {
    fs.unlink(filePath).catch(() => {});
  }, 300);
};
