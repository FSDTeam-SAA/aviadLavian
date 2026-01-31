import express from "express";
import { uploadSingle } from "../../middleware/multer.midleware";
import { createCategory, getAllCategories, updateCategory, deleteCategory, getSingleCategory } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createCategorySchema, updateCategorySchema } from "./category.validation";

const router = express.Router();

router.route("/create-category").post(uploadSingle("image"), validateRequest(createCategorySchema), createCategory);
router.route("/get-all-categories").get(getAllCategories);
router.route("/get-single-category/:categoryId").get(getSingleCategory);
router.route("/update-category/:categoryId").patch(uploadSingle("image"), validateRequest(updateCategorySchema), updateCategory);
router.route("/delete-category/:categoryId").delete(deleteCategory);


export default router;
