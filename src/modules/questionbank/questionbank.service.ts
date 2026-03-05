import { Types } from "mongoose";
import { QuestionModel } from "../Question/question.model";
import { QuestionBankAttemptModel } from "./questionbank.models";

// ─────────────────────────────────────────────
// Topic select করলে সব question আসবে (sequential number সহ)
// ─────────────────────────────────────────────
export const getQuestionsByTopicService = async (topicId: string) => {
  const questions = await QuestionModel.find({
    topicId: { $regex: `^${topicId}$`, $options: "i" },
    isDeleted: false,
    isHidden: false,
  })
    .select("-__v")
    .lean();

  // প্রতিটা question এ sequential number যোগ করছি
  const questionsWithSerial = questions.map((question, index) => ({
    serialNumber: index + 1,
    ...question,
  }));

  return questionsWithSerial;
};

// ─────────────────────────────────────────────
// User একটা question attempt করবে
// ─────────────────────────────────────────────
export const attemptQuestionBankService = async (
  userId: Types.ObjectId,
  questionId: Types.ObjectId,
  selectedOptionId: Types.ObjectId,
) => {
  // Question খুঁজে বের করো
  const question = await QuestionModel.findOne({
    _id: questionId,
    isDeleted: false,
    isHidden: false,
  });

  if (!question) {
    throw new Error("Question not found");
  }

  // Selected option টা question এ আছে কিনা check করো
  const selectedOption = question.options.find(
    (opt) => opt._id.toString() === selectedOptionId.toString(),
  );

  if (!selectedOption) {
    throw new Error("Selected option not found in this question");
  }

  const isCorrect = selectedOption.isCorrect;

  // Question এর totalAttempts ও correctAttempts update করো
  // এবং selected option এর selectedCount বাড়াও
  await QuestionModel.findOneAndUpdate(
    { _id: questionId, "options._id": selectedOptionId },
    {
      $inc: {
        totalAttempts: 1,
        correctAttempts: isCorrect ? 1 : 0,
        "options.$.selectedCount": 1,
      },
    },
  );

  // Attempt save করো
  const attempt = await QuestionBankAttemptModel.create({
    userId,
    questionId,
    selectedOptionId,
    isCorrect,
  });

  // Response এ question এর explanation ও option stats পাঠাও
  const updatedQuestion = await QuestionModel.findById(questionId).lean();

  return {
    attempt,
    isCorrect,
    correctOptionId: question.options.find((opt) => opt.isCorrect)?._id,
    explanation: question.explanation,
    optionStats: updatedQuestion?.options.map((opt) => ({
      optionId: opt._id,
      text: opt.text,
      selectedCount: opt.selectedCount,
      isCorrect: opt.isCorrect,
    })),
  };
};

// ─────────────────────────────────────────────
// একটা specific question এর details দেখো
// (explanation + option stats)
// ─────────────────────────────────────────────
export const getQuestionDetailsService = async (questionId: Types.ObjectId) => {
  const question = await QuestionModel.findOne({
    _id: questionId,
    isDeleted: false,
    isHidden: false,
  }).lean();

  if (!question) {
    throw new Error("Question not found");
  }

  return {
    ...question,
    optionStats: question.options.map((opt) => ({
      optionId: opt._id,
      text: opt.text,
      selectedCount: opt.selectedCount ?? 0,
      isCorrect: opt.isCorrect,
    })),
  };
};
