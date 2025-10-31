import { Response } from "express";

interface FileItem {
  url: string;
  name: string;
}

export const sendResponse = (
  res: Response,
  success: boolean,
  title: string,
  fileType: string,
  fileName?: string,
  files?: FileItem[],
  error?: string
) => {
  if (!success) {
    return res.status(500).json({
      success,
      error: error || "Conversion failed."
    });
  }


  const fileArray: FileItem[] = files
    ? files
    : fileName
    ? [{ url: `/output/${fileName}`, name: fileName }]
    : [];

  return res.json({
    success,
    title,
    fileType,
    files: fileArray
  });
};
