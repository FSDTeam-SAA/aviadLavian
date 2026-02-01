import express from "express";
import { createSubCategory } from "./label.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createLabelSchema } from "./label.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

router.post("/create-label", uploadSingle("image"), validateRequest(createLabelSchema), createSubCategory);

export default router;
