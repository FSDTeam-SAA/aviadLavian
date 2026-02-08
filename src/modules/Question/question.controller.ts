import { asyncHandler } from "../../utils/asyncHandler";
import { questionService } from "./question.service";
import ApiResponse from "../../utils/apiResponse";

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.createQuestion({
    ...req.body,
    createdBy: req?.user?._id,
  });

  ApiResponse.sendSuccess(res, 201, "Question created", question);
});

export const getAllQuestions = asyncHandler(async (_req, res) => {
  const questions = await questionService.getAllQuestions();
  ApiResponse.sendSuccess(res, 200, "Question list", questions);
});

export const getQuestionById = asyncHandler(async (req, res) => {
  const question = await questionService.getQuestionById(
    req.params.id as string,
  );
  ApiResponse.sendSuccess(res, 200, "Question details", question);
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.updateQuestion(
    req.params.id as string,
    req.body,
  );
  ApiResponse.sendSuccess(res, 200, "Question updated", question);
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.deleteQuestion(
    req.params.id as string,
  );
  ApiResponse.sendSuccess(res, 200, "Question deleted", question);
});

export const hideQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.toggleHideQuestion(
    req.params.id as string,
    true,
  );
  ApiResponse.sendSuccess(res, 200, "Question hidden", question);
});

export const unhideQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.toggleHideQuestion(
    req.params.id as string,
    false,
  );
  ApiResponse.sendSuccess(res, 200, "Question visible", question);
});
