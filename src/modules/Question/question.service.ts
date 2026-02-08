import { QuestionModel } from "./question.model";
import CustomError from "../../helpers/CustomError";
import { IQuestion } from "./question.interface";

const createQuestion = async (payload: Partial<IQuestion>) => {
  return await QuestionModel.create(payload);
};

const getAllQuestions = async () => {
  return await QuestionModel.find({ isDeleted: false }).populate(
    "subTopicId",
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

const updateQuestion = async (id: string, payload: any) => {
  const question = await QuestionModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!question) throw new CustomError(404, "Question not found");
  return question;
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
  toggleHideQuestion,
};
