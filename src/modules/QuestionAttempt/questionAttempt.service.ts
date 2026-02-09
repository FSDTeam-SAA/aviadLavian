
import CustomError from "../../helpers/CustomError";
import { QuestionModel } from "../Question/question.model";
import { AttemptModel } from "./questionAttempt.model";

const submitTutorAnswer = async ({
  examId,
  userId,
  questionId,
  selectedOptionId,
}: any) => {
  const exam = await ExamModel.findById(examId);
  if (!exam || exam.mode !== "tutor")
    throw new CustomError(400, "Invalid tutor exam");

  const question = await QuestionModel.findById(questionId);
  if (!question) throw new CustomError(404, "Question not found");

  const correctOption = question.options.find((o) => o.isCorrect);
  if (!correctOption) throw new CustomError(500, "Correct option missing");

  const isCorrect =
    correctOption._id.toString() === selectedOptionId.toString();

  await AttemptModel.create({
    examId,
    userId,
    questionId,
    selectedOptionId,
    isCorrect,
    marksObtained: isCorrect ? question.marks : 0,
  });

  // 🔥 option percentage
  const stats = await AttemptModel.aggregate([
    { $match: { questionId: question._id } },
    {
      $group: {
        _id: "$selectedOptionId",
        count: { $sum: 1 },
      },
    },
  ]);

  const total = stats.reduce((a, b) => a + b.count, 0);

  const optionPercentage = stats.map((s) => ({
    optionId: s._id,
    percentage: total ? Math.round((s.count / total) * 100) : 0,
  }));

  return {
    isCorrect,
    correctOptionId: correctOption._id,
    explanation: question.explanation,
    optionPercentage,
  };
};

export const tutorService = {
  submitTutorAnswer,
};
