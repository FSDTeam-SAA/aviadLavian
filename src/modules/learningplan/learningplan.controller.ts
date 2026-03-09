import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { learningPlanService } from "./learningplan.service";
import ApiResponse from "../../utils/apiResponse";

const createLearningPlan = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await learningPlanService.createLearningPlan(userId, req.body);
    ApiResponse.sendSuccess(res, 201, "Learning plan created successfully", result);
});

const getAllLearningPlans = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const result = await learningPlanService.getAllLearningPlans(userId, req.query);
    ApiResponse.sendSuccess(res, 200, "Learning plans fetched successfully", result.plans, result.meta);
});

const getSingleLearningPlan = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const id = req.params.id as string;
    const result = await learningPlanService.getSingleLearningPlan(userId, id);
    ApiResponse.sendSuccess(res, 200, "Learning plan fetched successfully", result);
});

const updateLearningPlan = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const id = req.params.id as string;
    const result = await learningPlanService.updateLearningPlan(userId, id, req.body);
    ApiResponse.sendSuccess(res, 200, "Learning plan updated successfully", result);
});

const deleteLearningPlan = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const id = req.params.id as string;
    const result = await learningPlanService.deleteLearningPlan(userId, id);
    ApiResponse.sendSuccess(res, 200, "Learning plan deleted successfully", result);
});

const addFlashcardToPlan = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const planId = req.params.planId as string;
    const result = await learningPlanService.addFlashcardToPlan(userId, planId, req.body);
    ApiResponse.sendSuccess(res, 201, "Flashcard added to learning plan", result);
});

const updateFlashcardProgress = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const planId = req.params.planId as string;
    const flashcardId = req.params.flashcardId as string;
    const result = await learningPlanService.updateFlashcardProgress(userId, planId, flashcardId, req.body);
    ApiResponse.sendSuccess(res, 200, "Flashcard progress updated", result);
});

const removeFlashcardFromPlan = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const planId = req.params.planId as string;
    const flashcardId = req.params.flashcardId as string;
    const result = await learningPlanService.removeFlashcardFromPlan(userId, planId, flashcardId);
    ApiResponse.sendSuccess(res, 200, "Flashcard removed from learning plan", result);
});

const addArticleToPlan = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const planId = req.params.planId as string;
    const result = await learningPlanService.addArticleToPlan(userId, planId, req.body);
    ApiResponse.sendSuccess(res, 201, "Article added to learning plan", result);
});

const updateArticleProgress = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const planId = req.params.planId as string;
    const articleId = req.params.articleId as string;
    const result = await learningPlanService.updateArticleProgress(userId, planId, articleId, req.body);
    ApiResponse.sendSuccess(res, 200, "Article progress updated", result);
});

const removeArticleFromPlan = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const planId = req.params.planId as string;
    const articleId = req.params.articleId as string;
    const result = await learningPlanService.removeArticleFromPlan(userId, planId, articleId);
    ApiResponse.sendSuccess(res, 200, "Article removed from learning plan", result);
});

export const learningPlanController = {
    createLearningPlan,
    getAllLearningPlans,
    getSingleLearningPlan,
    updateLearningPlan,
    deleteLearningPlan,
    addFlashcardToPlan,
    updateFlashcardProgress,
    removeFlashcardFromPlan,
    addArticleToPlan,
    updateArticleProgress,
    removeArticleFromPlan,
};
