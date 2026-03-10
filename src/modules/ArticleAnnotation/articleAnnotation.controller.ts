import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { articleAnnotationService } from "./articleAnnotation.service";
import CustomError from "../../helpers/CustomError";

const upsertAnnotation = asyncHandler(async (req: Request, res: Response) => {
    const { articleId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new CustomError(401, "User not authenticated");
    }

    if (!articleId) {
        throw new CustomError(400, "Article ID is required");
    }

    const result = await articleAnnotationService.upsertAnnotation(
        userId,
        articleId as string,
        req.body
    );

    ApiResponse.sendSuccess(
        res,
        200,
        "Annotations updated successfully",
        result
    );
});

const getAnnotationByArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new CustomError(401, "User not authenticated");
    }

    if (!articleId) {
        throw new CustomError(400, "Article ID is required");
    }

    const result = await articleAnnotationService.getAnnotationByArticle(
        userId,
        articleId as string
    );

    ApiResponse.sendSuccess(
        res,
        200,
        "Annotations retrieved successfully",
        result
    );
});

export const articleAnnotationController = {
    upsertAnnotation,
    getAnnotationByArticle,
};
