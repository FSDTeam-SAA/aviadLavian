import { QuestionModel } from "./question.model";
import CustomError from "../../helpers/CustomError";
import { IQuestion } from "./question.interface";

const createQuestion = async (payload: Partial<IQuestion>) => {
  return await QuestionModel.create(payload);
};

const getAllQuestions = async () => {
  return await QuestionModel.find({ isDeleted: false }).populate(
    "articleId",
    "name",
  );
};

const getQuestionById = async (id: string) => {
  const question = await QuestionModel.findOne({
    _id: id,
    isDeleted: false,
  });
  if (!question) throw new CustomError(404, "Question not found");
  return question;
};

const updateQuestion = async (id: string, payload: Partial<IQuestion>) => {
  const question = await QuestionModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!question) throw new CustomError(404, "Question not found");
  return question;
};
export const updateSingleOption = async (
  questionId: string,
  optionId: string,
  payload: { text?: string; isCorrect?: boolean },
) => {
  const question = await QuestionModel.findById(questionId);

  if (!question) {
    throw new CustomError(404, "Question not found");
  }

  const option = question.options.find(
    (opt) => opt._id.toString() === optionId,
  );

  if (!option) {
    throw new CustomError(404, "Option not found");
  }

  // ✅ Unique validation
  if (payload.text) {
    const duplicate = question.options.some(
      (opt) =>
        opt._id.toString() !== optionId &&
        opt.text.toLowerCase().trim() === payload.text!.toLowerCase().trim(),
    );

    if (duplicate) {
      throw new CustomError(400, "Duplicate options are not allowed");
    }
  }

  // ✅ Positional update (No full document validation issue)
  const updatedQuestion = await QuestionModel.findOneAndUpdate(
    { _id: questionId, "options._id": optionId },
    {
      $set: {
        ...(payload.text && { "options.$.text": payload.text }),
        ...(payload.isCorrect !== undefined && {
          "options.$.isCorrect": payload.isCorrect,
        }),
      },
    },
    { new: true, runValidators: true },
  );

  return updatedQuestion;
};
const deleteQuestion = async (id: string) => {
  const question = await QuestionModel.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!question) throw new CustomError(404, "Question not found");
  return question;
};

const toggleHideQuestion = async (id: string, isHidden: boolean) => {
  const question = await QuestionModel.findByIdAndUpdate(
    id,
    { isHidden },
    { new: true },
  );
  if (!question) throw new CustomError(404, "Question not found");
  return question;
};

export const questionService = {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  updateSingleOption,
  toggleHideQuestion,
};
