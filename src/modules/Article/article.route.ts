import express from "express";
import { articleController } from "./article.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createArticleSchema, updateArticleSchema } from "./article.validation";
import { authGuard, allowRole } from "../../middleware/auth.middleware";
import { uploadSingle } from "../../middleware/multer.midleware";
import multer from "multer";

const router = express.Router();

// Using standard multer to handle multiple fields
const upload = multer({
    dest: "public/temp", // Temporary directory as seen in other modules
});

const multiUpload = upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
]);

// Routes
router.post(
    "/create",

    multiUpload,
    validateRequest(createArticleSchema),
    articleController.createArticle
);

router.get("/get/:id", articleController.getSingleArticle);

router.get("/get-all", articleController.getAllArticles);

router.patch(
    "/update/:id",
    multiUpload,
    validateRequest(updateArticleSchema),
    articleController.updateArticle
);

router.delete(
    "/delete/:id",
    articleController.deleteArticle
);

export const articleRoutes = router;
