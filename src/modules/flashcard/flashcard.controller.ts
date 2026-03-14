import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateFlashcard, IUpdateFlashcard } from "./flashcard.interface";
import { flashcardService } from "./flashcard.service";
import { InjuryModel } from "../injury/injury.model";

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
  const { data,meta} = await flashcardService.getFlashcardByInjuryId(injuryId as string, req);

  ApiResponse.sendSuccess(res, 200, "Flashcard found", data, meta);
});

//get single flashcard
export const getFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const { flashcardId } = req.params;
  const flashcard = await flashcardService.getSingleFlashcard(flashcardId as string);
  ApiResponse.sendSuccess(res, 200, "Flashcard found", flashcard);
});

//get all flashcards
export const getAllFlashcards = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = (req as any).user?.role === "admin";

  const { data, meta } = await flashcardService.getAllFlashcards(
    req.query as any,
    (req as any).user?._id,
    isAdmin
  );

  const message = data.length > 0 ? "Flashcards found" : "No flashcards found";  

  ApiResponse.sendSuccess(res, 200, message, data, meta[0]);
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


//get all acuity and age group
export const getAgeGroupAndAcuity = async (req: Request, res: Response) => {
  const [ageGroups, acuities] = await Promise.all([
    InjuryModel.distinct("Age_Group", { Age_Group: { $nin: ["", null] } }),
    InjuryModel.distinct("Acuity", { Acuity: { $nin: ["", null] } }),
  ]);

  ApiResponse.sendSuccess(res, 200, "Age groups and acuities found", {
    ageGroups,
    acuities,
  });
};