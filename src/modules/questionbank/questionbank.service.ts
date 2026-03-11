import { Types } from "mongoose";
import { QuestionModel } from "../Question/question.model";
import { QuestionBankAttemptModel } from "./questionbank.models";
import { injuryService } from "../injury/injury.service";
import { paginationHelper } from "../../utils/pagination";

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

  const attemptMap = new Map<
    string,
    { isCorrect: boolean; selectedOptionId: string }
  >();
  attemptedQuestions.forEach((attempt) => {
    attemptMap.set(attempt.questionId.toString(), {
      isCorrect: attempt.isCorrect,
      selectedOptionId: attempt.selectedOptionId.toString(),
    });
  });

  const questionsWithSerial = questions.map((question, index) => {
    const attempt = attemptMap.get(question._id.toString());
    const isAttempted = !!attempt;

    return {
      ...question,
      serialNumber: index + 1,
      isAttempted,
      isCorrect: attempt?.isCorrect ?? null,
      // ✅ attempt করলে isCorrect দেখাবে, না করলে hide
      options: question.options.map((opt) => ({
        _id: opt._id,
        text: opt.text,
        selectedCount: opt.selectedCount,
        ...(isAttempted && { isCorrect: opt.isCorrect }),
      })),
    };
  });

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

  const attemptRecord = await QuestionBankAttemptModel.findOne({
    userId,
    questionId,
  }).lean();

  const isAttempted = !!attemptRecord;

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

  const { options, explanation, ...questionWithoutSensitiveData } = question;

  return {
    ...questionWithoutSensitiveData,
    isAttempted,
    nextQuestionId,
    explanation: isAttempted ? explanation : undefined,
    optionStats: options.map((opt) => ({
      optionId: opt._id,
      text: opt.text,
      selectedCount: opt.selectedCount ?? 0,
      ...(isAttempted && { isCorrect: opt.isCorrect }),
    })),
  };
};

export const getAttemptByTopicService = async (
  topicId: string,
  userId: Types.ObjectId,
  includeQuestions: boolean = true,
) => {
  const questions = await QuestionModel.find({
    topicId: { $regex: `^${topicId}$`, $options: "i" },
    isDeleted: false,
    isHidden: false,
  }).lean();

  const totalQuestions = questions.length;

  const attempts = await QuestionBankAttemptModel.find({
    userId,
    topicId: { $regex: `^${topicId}$`, $options: "i" },
  }).lean();

  const attemptedSet = new Set(attempts.map((a) => a.questionId.toString()));
  const attemptedCount = attempts.length;

  const completionPercentage =
    totalQuestions > 0
      ? Math.round((attemptedCount / totalQuestions) * 100)
      : 0;

  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const incorrectCount = attempts.filter((a) => !a.isCorrect).length;

  const correctPercentage =
    attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  const incorrectPercentage =
    attemptedCount > 0
      ? Math.round((incorrectCount / attemptedCount) * 100)
      : 0;

  let questionsWithDetails: any[] = [];

  if (includeQuestions) {
    questionsWithDetails = questions.map((question, index) => ({
      serialNumber: index + 1,
      _id: question._id,
      questionText: question.questionText,
      explanation: question.explanation,
      isAttempted: attemptedSet.has(question._id.toString()),
      options: question.options.map((opt) => ({
        optionId: opt._id,
        text: opt.text,
        selectedCount: opt.selectedCount ?? 0,
        isCorrect: opt.isCorrect,
      })),
    }));
  }

  return {
    topicId,
    totalQuestions,
    attemptedCount,
    completionPercentage,

    stats: {
      correctCount,
      incorrectCount,
      correctPercentage,
      incorrectPercentage,
    },

    ...(includeQuestions && { questions: questionsWithDetails }),
  };
};

export const questionBankEntryService = async (
  userId: Types.ObjectId,
  query: any,
) => {
  const bodyRegions = await injuryService.getBodyRegions();

  const promises = bodyRegions.map((bodyRegion: any) =>
    getAttemptByTopicService(bodyRegion, userId, false),
  );

  const results = await Promise.all(promises);

  // pagination helper
  const { page, limit, skip } = paginationHelper(query.page, query.limit);

  const paginatedData = results.slice(skip, skip + limit);

  return {
    meta: {
      page,
      limit,
      total: results.length,
      totalPage: Math.ceil(results.length / limit),
    },
    data: paginatedData,
  };
};
