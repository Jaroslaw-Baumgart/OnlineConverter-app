import express from "express";
import cors from "cors";
import path from "path";
import { createUpload } from "./middlewares/upload";
import { fileValidation } from "./middlewares/fileValidation";
import { routeDispatcher } from "./middlewares/routeDispatcher";

export function createApp(uploadDirectory = "uploads/") {
  const upload = createUpload(uploadDirectory);
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/output", express.static(path.join(__dirname, "../output")));

  app.post("/convert", upload.single("file"), fileValidation, routeDispatcher);

  return app;
}

const app = createApp();

export default app;
