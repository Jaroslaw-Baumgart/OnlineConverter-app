import { Router } from "express";
import { upload } from "../middlewares/upload";
import { jpgToPng, pngToJpg, jpgToPdf } from "../controllers/imageController";

const router = Router();

router.post("/jpg-to-png", upload.single("image"), jpgToPng);
router.post("/png-to-jpg", upload.single("image"), pngToJpg);
router.post("/jpg-to-pdf", upload.single("image"), jpgToPdf);

export default router;
