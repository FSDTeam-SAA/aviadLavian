import { Types } from "mongoose";
import { QuestionModel } from "../Question/question.model";
import { QuestionBankAttemptModel } from "./questionbank.models";

export const getQuestionsByTopicService = async (
  topicId: string,
  userId: string,
) => {
  const questions = await QuestionModel.find({
    topicId: { $regex: `^${topicId}$`, $options: "i" },
    isDeleted: false,
    isHidden: false,
  }).lean();

  const attemptedQuestions = await QuestionBankAttemptModel.find({
    userId,
    topicId: { $regex: `^${topicId}$`, $options: "i" },
  }).lean();

  const attemptedSet = new Set(
    attemptedQuestions.map((q) => q.questionId.toString()),
  );

  const questionsWithSerial = questions.map((question, index) => ({
    ...question,
    serialNumber: index + 1,
    isAttempted: attemptedSet.has(question._id.toString()),
  }));

  return questionsWithSerial;
};

export const attemptQuestionBankService = async (
  userId: Types.ObjectId,
  questionId: Types.ObjectId,
  selectedOptionId: Types.ObjectId,
) => {
  const question = await QuestionModel.findOne({
    _id: questionId,
    isDeleted: false,
    isHidden: false,
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const selectedOption = question.options.find(
    (opt) => opt._id.toString() === selectedOptionId.toString(),
  );

  if (!selectedOption) {
    throw new Error("Selected option not found in this question");
  }

  const isCorrect = selectedOption.isCorrect;

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

  const topicId = await QuestionModel.findById(questionId).select("topicId");
  console.log(topicId!.topicId, "poiwjetgopuj0e42");

  const attempt = await QuestionBankAttemptModel.create({
    userId,
    questionId,
    selectedOptionId,
    isCorrect,
    topicId: topicId!.topicId,
    isAttempted: true,
  });

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

export const getQuestionDetailsService = async (
  questionId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const question = await QuestionModel.findOne({
    _id: questionId,
    isDeleted: false,
    isHidden: false,
  }).lean();

  if (!question) {
    throw new Error("Question not found");
  }

  const isAttempted = await QuestionBankAttemptModel.findOne({
    userId,
    questionId,
  });

  const allQuestionsInTopic = await QuestionModel.find({
    topicId: question.topicId,
    isDeleted: false,
    isHidden: false,
  })
    .select("_id")
    .sort({ createdAt: 1 })
    .lean();

  const currentIndex = allQuestionsInTopic.findIndex(
    (q) => q._id.toString() === questionId.toString(),
  );

  const nextQuestionId =
    currentIndex !== -1 && currentIndex < allQuestionsInTopic.length - 1
      ? allQuestionsInTopic[currentIndex + 1]!._id
      : null;

  return {
    ...question,
    isAttempted: !!isAttempted,
    nextQuestionId,
    optionStats: question.options.map((opt) => ({
      optionId: opt._id,
      text: opt.text,
      selectedCount: opt.selectedCount ?? 0,
      isCorrect: opt.isCorrect,
    })),
  };
};

export const getAttemptByTopicService = async (
  topicId: string,
  userId: Types.ObjectId,
) => {
  // 1️⃣ Get all questions in topic
  const questions = await QuestionModel.find({
    topicId: { $regex: `^${topicId}$`, $options: "i" },
    isDeleted: false,
    isHidden: false,
  }).lean();

  const totalQuestions = questions.length;

  // 2️⃣ Get all user attempts for this topic
  const attemptedQuestions = await QuestionBankAttemptModel.find({
    userId,
    topicId: { $regex: `^${topicId}$`, $options: "i" },
  }).lean();

  const attemptedSet = new Set(
    attemptedQuestions.map((q) => q.questionId.toString()),
  );

  const attemptedCount = attemptedSet.size;

  // 3️⃣ Calculate percentage complete
  const completionPercentage =
    totalQuestions > 0
      ? Math.round((attemptedCount / totalQuestions) * 100)
      : 0;

  // 4️⃣ Map questions with serial number, isAttempted, option stats
  const questionsWithDetails = questions.map((question, index) => ({
    serialNumber: index + 1,
    _id: question._id,
    questionText: question.questionText,
    explanation: question.explanation,
    isAttempted: attemptedSet.has(question._id.toString()),
    options: question.options.map((opt) => ({
      optionId: opt._id,
      text: opt.text,
      isCorrect: opt.isCorrect,
      selectedCount: opt.selectedCount ?? 0,
    })),
  }));

  return {
    topicId,
    totalQuestions,
    attemptedCount,
    completionPercentage,
    questions: questionsWithDetails,
  };
};
