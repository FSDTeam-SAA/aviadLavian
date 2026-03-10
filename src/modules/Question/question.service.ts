import { QuestionModel } from "./question.model";
import CustomError from "../../helpers/CustomError";
import { IQuestion, IUpdateQuestion } from "./question.interface";
import { paginationHelper } from "../../utils/pagination";

const createQuestion = async (payload: Partial<IQuestion>) => {
  try {
    return await QuestionModel.create(payload);
  } catch (error: any) {
    if (error.code === 11000) {
      throw new CustomError(
        400,
        "A question with this text already exists under this article",
      );
    }
    throw error;
  }
};

const getAllQuestions = async (query: any) => {
  const filter: any = { isDeleted: false };

  if (query.articleId) filter.articleId = query.articleId;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.isHidden !== undefined) filter.isHidden = query.isHidden === "true";

  // pagination
  const { page, limit, skip } = paginationHelper(query.page, query.limit);

  const total = await QuestionModel.countDocuments(filter);

  const questions = await QuestionModel.find(filter)
    .populate("articleId", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: questions,
  };
};

const getQuestionById = async (id: string) => {
  const question = await QuestionModel.findOne({
    _id: id,
    isDeleted: false,
  });
  if (!question) throw new CustomError(404, "Question not found");
  return question;
};

const updateQuestion = async (
  id: string,
  payload: Partial<IUpdateQuestion>,
) => {
  const allowedFields = {
    articleId: payload.articleId,
    topicId: payload.topicId,
    questionText: payload.questionText,
    explanation: payload.explanation,
    marks: payload.marks,
    isHidden: payload.isHidden,
    isDeleted: payload.isDeleted,
  };
  const question = await QuestionModel.findByIdAndUpdate(id, allowedFields, {
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

  if (payload.isCorrect === true) {
    await QuestionModel.updateOne(
      { _id: questionId },
      { $set: { "options.$[].isCorrect": false } },
    );
  }

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
