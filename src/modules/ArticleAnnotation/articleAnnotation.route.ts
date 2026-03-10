import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { articleAnnotationController } from "./articleAnnotation.controller";
import { articleAnnotationValidation } from "./articleAnnotation.validation";
import { authGuard } from "../../middleware/auth.middleware";

const router = Router();

router.patch(
    "/:articleId",
    authGuard,
    validateRequest(articleAnnotationValidation.upsertAnnotationZodSchema),
    articleAnnotationController.upsertAnnotation
);

router.get(
    "/:articleId",
    authGuard,
    articleAnnotationController.getAnnotationByArticle
);

export const ArticleAnnotationRoute = router;
