import express from "express";
import { uploadSingle } from "../../middleware/multer.midleware";
import { createCategory } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createCategorySchema } from "./category.validation";

const router = express.Router();

router.route("/create-category").post(uploadSingle("image"), validateRequest(createCategorySchema), createCategory);


export default router;
