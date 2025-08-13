import { Router } from "express";
import { upload } from "../middlewares/upload";
import { docxToPdf } from "../controllers/docController";

const router = Router();

router.post("/docx-to-pdf", upload.single("docx"), docxToPdf);

export default router;
