import express from "express";
import { createSubCategory } from "./subcategory.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createSubCategorySchema } from "./subcategory.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

router.post("/create-subcategory", uploadSingle("image"), validateRequest(createSubCategorySchema), createSubCategory);

export default router;
