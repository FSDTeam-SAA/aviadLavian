import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateFlashcard, IUpdateFlashcard } from "./flashcard.interface";
import { flashcardService } from "./flashcard.service";

//create flashcard
export const createFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateFlashcard = req.body;

  const image = req.file as Express.Multer.File;
  const flashcard = await flashcardService.createFlashcard(data, image);
  ApiResponse.sendSuccess(res, 201, "Flashcard created successfully", flashcard);
});


//get flashcard by injuryId
export const getFlashcardByInjuryId = asyncHandler(async (req: Request, res: Response) => {
  const { injuryId } = req.params;
  const flashcard = await flashcardService.getFlashcardByInjuryId(injuryId as string, req);

  ApiResponse.sendSuccess(res, 200, "Flashcard found", flashcard);
});

//get single flashcard
export const getFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const { flashcardId } = req.params;
  const flashcard = await flashcardService.getSingleFlashcard(flashcardId as string);
  ApiResponse.sendSuccess(res, 200, "Flashcard found", flashcard);
});

//get all flashcards
export const getAllFlashcards = asyncHandler(async (req: Request, res: Response) => {

  const isAdmin = (req as any).user?.role === "admin"? true : false;

  const { flashcards, meta } = await flashcardService.getAllFlashcards(req.query, (req as any).user?._id, isAdmin);
  ApiResponse.sendSuccess(res, 200, "Flashcards found ", flashcards, meta);
});

//update flashcard
export const updateFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const { flashcardId } = req.params;
  const image = req.file as Express.Multer.File;
  const data: IUpdateFlashcard = req.body;
  const flashcard = await flashcardService.updateFlashcard(flashcardId as string, data, image as Express.Multer.File);
  ApiResponse.sendSuccess(res, 200, "Flashcard updated successfully", flashcard);
});

//delete flashcard
export const deleteFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const { flashcardId } = req.params;
  const flashcard = await flashcardService.deleteFlashcard(flashcardId as string);
  ApiResponse.sendSuccess(res, 200, "Flashcard deleted successfully", {
    id: flashcard._id,
    question: flashcard.question
  });
});