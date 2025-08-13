import { Router } from "express";
import { upload } from "../middlewares/upload";
import { pdfToJpg, pdfToTxt, txtToPdf, jpgToPdf } from "../controllers/pdfController";

const router = Router();

router.post("/pdf-to-jpg", upload.single("file"), pdfToJpg);
router.post("/pdf-to-txt", upload.single("file"), pdfToTxt);
router.post("/txt-to-pdf", upload.single("file"), txtToPdf);
router.post("/jpg-to-pdf", upload.single("file"), jpgToPdf);



export default router;
