import multer from "multer";
import path from "path";

export function createUpload(uploadDirectory: string) {
  const storage = multer.diskStorage({
    destination: uploadDirectory,
    filename: (_, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  return multer({ storage });
}

export const upload = createUpload("uploads/");
