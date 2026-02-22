import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { articleService } from "./article.service";
import ApiResponse from "../../utils/apiResponse";

const createArticle = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as { image?: Express.Multer.File[]; video?: Express.Multer.File[] };
    const result = await articleService.createArticle(req.body, files);
    ApiResponse.sendSuccess(res, 201, "Article created successfully", result);
});

const getSingleArticle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await articleService.getSingleArticle(id as string);
    ApiResponse.sendSuccess(res, 200, "Article fetched successfully", result);
});

const getAllArticles = asyncHandler(async (req: Request, res: Response) => {
    const result = await articleService.getAllArticles(req.query);
    ApiResponse.sendSuccess(res, 200, "Articles fetched successfully", result.articles, result.meta);
});

const updateArticle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as { image?: Express.Multer.File[]; video?: Express.Multer.File[] };
    const result = await articleService.updateArticle(id as string, req.body, files);
    ApiResponse.sendSuccess(res, 200, "Article updated successfully", result);
});

const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await articleService.deleteArticle(id as string);
    ApiResponse.sendSuccess(res, 200, "Article deleted successfully", result);
});

export const articleController = {
    createArticle,
    getSingleArticle,
    getAllArticles,
    updateArticle,
    deleteArticle,
};
