import { Types } from "mongoose";
import { QuestionModel } from "../Question/question.model";
import { QuizModel } from "./quiz.models";
import { paginationHelper } from "../../utils/pagination";

export const createQuizService = async (
  userId: Types.ObjectId,
  topicIds: string[],
  quizName: string,
  mode: "study" | "exam",
  questionCount: number,
  timeLimitMinutes: number | null,
) => {
  if (!topicIds || topicIds.length === 0) {
    throw new Error("At least one topic must be selected");
  }

  const topicRegex = topicIds.map((id) => new RegExp(`^${id}$`, "i"));

  const allQuestions = await QuestionModel.find({
    topicId: { $in: topicRegex },
    isDeleted: false,
    isHidden: false,
  })
    .select("-__v")
    .lean();

  if (allQuestions.length === 0) {
    throw new Error("No questions available for the selected topics");
  }

  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);

  const selectedCount = Math.min(questionCount, shuffled.length);
  const selectedQuestions = shuffled.slice(0, selectedCount);

  const questionIds = selectedQuestions.map((q) => q._id);
  const totalMarks = selectedQuestions.reduce(
    (sum, q) => sum + (q.marks || 1),
    0,
  );

  const quiz = await QuizModel.create({
    userId,
    topicIds,
    quizName,
    mode,
    questions: questionIds,
    totalQuestions: selectedCount,
    totalMarks,
    timeLimitMinutes,
    startedAt: new Date(),
  });

  return quiz;
};

export const getQuizQuestionsService = async (
  quizId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const quiz = await QuizModel.findOne({ _id: quizId, userId }).lean();

  if (!quiz) throw new Error("Quiz not found");
  if (quiz.status === "submitted") throw new Error("Quiz already submitted");

  const questions = await QuestionModel.find({
    _id: { $in: quiz.questions },
  })
    .select("-__v")
    .lean();

  // question গুলো quiz এর order অনুযায়ী sort করো
  // কারণ MongoDB find() always order guarantee করে না
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  const orderedQuestions = quiz.questions.map((qId, index) => {
    const question = questionMap.get(qId.toString());
    return {
      serialNumber: index + 1,
      ...question,
      options: question?.options.map((opt) => ({
        _id: opt._id,
        text: opt.text,
        selectedCount: opt.selectedCount ?? 0,
        // isCorrect intentionally hidden
      })),
    };
  });

  // Study mode এ already answered গুলো mark করো
  const answeredMap = new Map(
    quiz.answers.map((a) => [a.questionId.toString(), a]),
  );

  const questionsWithStatus = orderedQuestions.map((q) => {
    const answered = answeredMap.get(q._id?.toString() ?? "");
    return {
      ...q,
      isAnswered: !!answered,
      // study mode এ already answered হলে selected option দেখাবে
      selectedOptionId: answered?.selectedOptionId ?? null,
    };
  });

  return {
    quiz: {
      _id: quiz._id,
      quizName: quiz.quizName,
      topicIds: quiz.topicIds,
      mode: quiz.mode,
      totalQuestions: quiz.totalQuestions,
      attemptedQuestions: quiz.attemptedQuestions,
      timeLimitMinutes: quiz.timeLimitMinutes,
      isPaused: quiz.isPaused,
      startedAt: quiz.startedAt,
      status: quiz.status,
    },
    questions: questionsWithStatus,
  };
};

export const studyModeAnswerService = async (
  quizId: Types.ObjectId,
  userId: Types.ObjectId,
  questionId: Types.ObjectId,
  selectedOptionId: Types.ObjectId,
) => {
  const quiz = await QuizModel.findOne({ _id: quizId, userId });

  if (!quiz) throw new Error("Quiz not found");
  if (quiz.mode !== "study") throw new Error("This is not a study mode quiz");
  if (quiz.status === "submitted") throw new Error("Quiz already submitted");

  // এই question টা quiz এ আছে কিনা check করো
  const questionExists = quiz.questions.some(
    (qId) => qId.toString() === questionId.toString(),
  );
  if (!questionExists) throw new Error("Question not found in this quiz");

  // Already answered কিনা check করো
  const alreadyAnswered = quiz.answers.find(
    (a) => a.questionId.toString() === questionId.toString(),
  );
  if (alreadyAnswered) throw new Error("This question is already answered");

  // Question details আনো
  const question = await QuestionModel.findById(questionId).lean();
  if (!question) throw new Error("Question not found");

  const selectedOption = question.options.find(
    (opt) => opt._id.toString() === selectedOptionId.toString(),
  );
  if (!selectedOption) throw new Error("Option not found in this question");

  const isCorrect = selectedOption.isCorrect;

  // Quiz এ answer push করো এবং stats update করো
  await QuizModel.findByIdAndUpdate(quizId, {
    $push: {
      answers: {
        questionId,
        selectedOptionId,
        isCorrect,
        answeredAt: new Date(),
      },
    },
    $inc: {
      attemptedQuestions: 1,
      correctAnswers: isCorrect ? 1 : 0,
      incorrectAnswers: isCorrect ? 0 : 1,
      obtainedMarks: isCorrect ? question.marks || 1 : 0,
    },
  });

  // Question global stats update করো
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

  // Updated option stats আনো
  const updatedQuestion = await QuestionModel.findById(questionId).lean();

  return {
    isCorrect,
    correctOptionId: question.options.find((opt) => opt.isCorrect)?._id,
    explanation: question.explanation,
    optionStats: updatedQuestion?.options.map((opt) => ({
      optionId: opt._id,
      text: opt.text,
      isCorrect: opt.isCorrect,
      selectedCount: opt.selectedCount ?? 0,
    })),
  };
};

export const submitQuizService = async (
  quizId: Types.ObjectId,
  userId: Types.ObjectId,
  timeSpentSeconds: number,
  answers?: { questionId: string; selectedOptionId: string | null }[],
) => {
  const quiz = await QuizModel.findOne({ _id: quizId, userId });

  if (!quiz) throw new Error("Quiz not found");
  if (quiz.status === "submitted") throw new Error("Quiz already submitted");

  if (quiz.mode === "exam") {
    if (!answers || answers.length === 0) {
      throw new Error("Answers are required for exam mode");
    }

    const questions = await QuestionModel.find({
      _id: { $in: quiz.questions },
    }).lean();

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let obtainedMarks = 0;
    let attemptedQuestions = 0;

    const processedAnswers = quiz.questions.map((questionId) => {
      const question = questionMap.get(questionId.toString());
      const userAnswer = answers.find(
        (a) => a.questionId === questionId.toString(),
      );

      const selectedOptionId = userAnswer?.selectedOptionId || null;

      if (!selectedOptionId || !question) {
        return { questionId, selectedOptionId: null, isCorrect: false };
      }

      attemptedQuestions++;

      const selectedOption = question.options.find(
        (opt) => opt._id.toString() === selectedOptionId,
      );

      const isCorrect = selectedOption?.isCorrect ?? false;

      if (isCorrect) {
        correctAnswers++;
        obtainedMarks += question.marks || 1;
      } else {
        incorrectAnswers++;
      }

      // Question global stats update
      QuestionModel.findOneAndUpdate(
        { _id: questionId, "options._id": selectedOptionId },
        {
          $inc: {
            totalAttempts: 1,
            correctAttempts: isCorrect ? 1 : 0,
            "options.$.selectedCount": 1,
          },
        },
      ).exec();

      return {
        questionId,
        selectedOptionId: new Types.ObjectId(selectedOptionId),
        isCorrect,
        answeredAt: new Date(),
      };
    });

    const scorePercentage =
      quiz.totalQuestions > 0
        ? Math.round((correctAnswers / quiz.totalQuestions) * 100)
        : 0;

    await QuizModel.findByIdAndUpdate(quizId, {
      answers: processedAnswers,
      correctAnswers,
      incorrectAnswers,
      attemptedQuestions,
      obtainedMarks,
      scorePercentage,
      timeSpentSeconds,
      status: "submitted",
      submittedAt: new Date(),
    });
  } else {
    const updatedQuiz = await QuizModel.findOne({ _id: quizId, userId }).lean();
    const scorePercentage =
      updatedQuiz && updatedQuiz.totalQuestions > 0
        ? Math.round(
            (updatedQuiz.correctAnswers / updatedQuiz.totalQuestions) * 100,
          )
        : 0;

    await QuizModel.findByIdAndUpdate(quizId, {
      scorePercentage,
      timeSpentSeconds,
      status: "submitted",
      submittedAt: new Date(),
    });
  }

  return await QuizModel.findById(quizId).lean();
};

export const getQuizResultService = async (
  quizId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const quiz = await QuizModel.findOne({ _id: quizId, userId }).lean();

  if (!quiz) throw new Error("Quiz not found");
  if (quiz.status !== "submitted") throw new Error("Quiz not submitted yet");

  const questions = await QuestionModel.find({
    _id: { $in: quiz.questions },
  }).lean();

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
  const answerMap = new Map(
    quiz.answers.map((a) => [a.questionId.toString(), a]),
  );

  const detailedResults = quiz.questions.map((questionId, index) => {
    const question = questionMap.get(questionId.toString());
    const userAnswer = answerMap.get(questionId.toString());

    return {
      serialNumber: index + 1,
      questionId,
      questionText: question?.questionText,
      explanation: question?.explanation,
      selectedOptionId: userAnswer?.selectedOptionId ?? null,
      isCorrect: userAnswer?.isCorrect ?? false,
      isAttempted: !!userAnswer?.selectedOptionId,
      options: question?.options.map((opt) => ({
        _id: opt._id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        selectedCount: opt.selectedCount ?? 0,
      })),
    };
  });

  return {
    quizSummary: {
      _id: quiz._id,
      quizName: quiz.quizName,
      topicIds: quiz.topicIds,
      mode: quiz.mode,
      totalQuestions: quiz.totalQuestions,
      attemptedQuestions: quiz.attemptedQuestions,
      correctAnswers: quiz.correctAnswers,
      incorrectAnswers: quiz.incorrectAnswers,
      scorePercentage: quiz.scorePercentage,
      totalMarks: quiz.totalMarks,
      obtainedMarks: quiz.obtainedMarks,
      timeLimitMinutes: quiz.timeLimitMinutes,
      timeSpentSeconds: quiz.timeSpentSeconds,
      startedAt: quiz.startedAt,
      submittedAt: quiz.submittedAt,
    },
    detailedResults,
  };
};

export const getQuizProgressService = async (
  quizId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const quiz = await QuizModel.findOne({ _id: quizId, userId }).lean();
  if (!quiz) throw new Error("Quiz not found");

  const allQuizzes = await QuizModel.find({
    userId,
    mode: quiz.mode,
    status: "submitted",
  })
    .select(
      "correctAnswers incorrectAnswers totalQuestions scorePercentage obtainedMarks totalMarks",
    )
    .lean();

  const totalQuizzes = allQuizzes.length;
  const totalQuestionsAttempted = allQuizzes.reduce(
    (sum, q) => sum + q.totalQuestions,
    0,
  );
  const totalCorrect = allQuizzes.reduce((sum, q) => sum + q.correctAnswers, 0);
  const totalIncorrect = allQuizzes.reduce(
    (sum, q) => sum + q.incorrectAnswers,
    0,
  );
  const averageScore =
    totalQuizzes > 0
      ? Math.round(
          allQuizzes.reduce((sum, q) => sum + q.scorePercentage, 0) /
            totalQuizzes,
        )
      : 0;

  return {
    mode: quiz.mode,
    totalQuizzes,
    totalQuestionsAttempted,
    totalCorrect,
    totalIncorrect,
    averageScore,
    // Current quiz progress
    currentQuiz: {
      _id: quiz._id,
      quizName: quiz.quizName,
      totalQuestions: quiz.totalQuestions,
      attemptedQuestions: quiz.attemptedQuestions,
      correctAnswers: quiz.correctAnswers,
      incorrectAnswers: quiz.incorrectAnswers,
      scorePercentage: quiz.scorePercentage,
    },
  };
};

export const getQuizHistoryService = async (
  userId: Types.ObjectId,
  mode?: "exam" | "study",
) => {
  const filter: any = { userId, status: "submitted" };

  if (mode) {
    filter.mode = mode;
  }

  const quizzes = await QuizModel.find(filter)
    .select(
      "quizName topicIds mode totalQuestions correctAnswers incorrectAnswers scorePercentage obtainedMarks totalMarks timeSpentSeconds submittedAt",
    )
    .sort({ submittedAt: -1 })
    .lean();

  return quizzes;
};

export const getSingleQuestionResultService = async (
  quizId: Types.ObjectId,
  userId: Types.ObjectId,
  questionId: Types.ObjectId,
) => {
  const quiz = await QuizModel.findOne({ _id: quizId, userId }).lean();
  if (!quiz) throw new Error("Quiz not found");
  if (quiz.status !== "submitted") throw new Error("Quiz not submitted yet");

  // check if user attempted this question
  const userAnswer = quiz.answers.find(
    (a) => a.questionId.toString() === questionId.toString(),
  );
  if (!userAnswer) throw new Error("Question not attempted in this quiz");

  const question = await QuestionModel.findById(questionId).lean();
  if (!question) throw new Error("Question not found");

  return {
    questionId: question._id,
    questionText: question.questionText,
    explanation: question.explanation,
    isCorrect: userAnswer.isCorrect,
    selectedOptionId: userAnswer.selectedOptionId,
    options: question.options.map((opt) => ({
      optionId: opt._id,
      text: opt.text,
      isCorrect: opt.isCorrect,
      selectedCount: opt.selectedCount ?? 0,
    })),
  };
};

export const deleteQuizService = async (
  quizId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  // check quiz exists
  const quiz = await QuizModel.findOne({ _id: quizId, userId });
  if (!quiz) throw new Error("Quiz not found");

  // delete quiz
  await QuizModel.deleteOne({ _id: quizId });

  return { message: "Quiz deleted successfully" };
};

export const getAllQuizService = async (query: any) => {
  const { page, limit, skip } = paginationHelper(query.page, query.limit);

  const filter: any = {};

  if (query.mode) {
    filter.mode = query.mode;
  }

  const quizzes = await QuizModel.find(filter)
    .populate("userId", "name email")
    .select(
      "quizName topicIds mode totalQuestions attemptedQuestions correctAnswers incorrectAnswers scorePercentage obtainedMarks totalMarks status timeSpentSeconds startedAt submittedAt",
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await QuizModel.countDocuments(filter);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: quizzes,
  };
};
