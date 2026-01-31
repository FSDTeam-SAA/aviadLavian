import express from "express";
import { uploadSingle } from "../../middleware/multer.midleware";
import { createCategory, getAllCategories, updateCategory } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createCategorySchema, updateCategorySchema } from "./category.validation";

const router = express.Router();

router.route("/create-category").post(uploadSingle("image"), validateRequest(createCategorySchema), createCategory);
router.route("/get-all-categories").get(getAllCategories);
router.route("/get-single-category/:categoryId").get(getAllCategories);
router.route("/update-category/:categoryId").patch(uploadSingle("image"), validateRequest(updateCategorySchema) ,updateCategory);


export default router;
