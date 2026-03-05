import { Types } from "mongoose";
import { QuestionModel } from "../Question/question.model";
import { ExamAttemptModel } from "./examattempt.models";

// ─────────────────────────────────────────────
// নতুন exam শুরু করো
// Topic থেকে 60 টা random question নেবে
// ─────────────────────────────────────────────
export const startExamService = async (
  userId: Types.ObjectId,
  topicId: string,
  examName: string,
  timeLimitMinutes: number = 120,
) => {
  // Topic থেকে সব available question আনো
  const allQuestions = await QuestionModel.find({
    topicId: { $regex: `^${topicId}$`, $options: "i" },
    isDeleted: false,
    isHidden: false,
  })
    .select("_id marks")
    .lean();

  console.log(allQuestions.length);

  if (allQuestions.length < 1) {
    throw new Error("Not enough questions available for this topic");
  }

  // 60 টার বেশি থাকলে random 60 টা নাও, কম থাকলে যা আছে তাই নাও
  const questionLimit = Math.min(60, allQuestions.length);

  // Fisher-Yates shuffle করে random নেওয়া
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  const selectedQuestions = shuffled.slice(0, questionLimit);

  const questionIds = selectedQuestions.map((q) => q._id);
  const totalMarks = selectedQuestions.reduce(
    (sum, q) => sum + (q.marks || 1),
    0,
  );

  const exam = await ExamAttemptModel.create({
    userId,
    topicId,
    examName,
    questions: questionIds,
    totalQuestions: questionLimit,
    totalMarks,
    timeLimitMinutes,
    startedAt: new Date(),
  });

  return exam;
};

// ─────────────────────────────────────────────
// Exam এর সব question আনো (answer ছাড়া)
// Exam চলাকালীন এই API call হবে
// ─────────────────────────────────────────────
export const getExamQuestionsService = async (
  examId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const exam = await ExamAttemptModel.findOne({
    _id: examId,
    userId,
  }).lean();

  if (!exam) {
    throw new Error("Exam not found");
  }

  if (exam.status === "submitted") {
    throw new Error("This exam has already been submitted");
  }

  // Question গুলো আনো কিন্তু isCorrect field hide করো
  const questions = await QuestionModel.find({
    _id: { $in: exam.questions },
  })
    .select("-__v")
    .lean();

  // Serial number যোগ করো এবং isCorrect hide করো
  const questionsWithSerial = questions.map((question, index) => ({
    serialNumber: index + 1,
    ...question,
    options: question.options.map((opt) => ({
      _id: opt._id,
      text: opt.text,
      selectedCount: opt.selectedCount,
      // isCorrect intentionally hide করা হয়েছে exam mode এ
    })),
  }));

  return {
    exam: {
      _id: exam._id,
      examName: exam.examName,
      topicId: exam.topicId,
      totalQuestions: exam.totalQuestions,
      timeLimitMinutes: exam.timeLimitMinutes,
      startedAt: exam.startedAt,
      status: exam.status,
    },
    questions: questionsWithSerial,
  };
};

// ─────────────────────────────────────────────
// Exam submit করো
// সব answer একসাথে পাঠাবে
// ─────────────────────────────────────────────
export const submitExamService = async (
  examId: Types.ObjectId,
  userId: Types.ObjectId,
  timeSpentSeconds: number,
  answers: { questionId: string; selectedOptionId: string | null }[],
) => {
  const exam = await ExamAttemptModel.findOne({
    _id: examId,
    userId,
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  if (exam.status === "submitted") {
    throw new Error("This exam has already been submitted");
  }

  // সব question এর correct answer আনো
  const questions = await QuestionModel.find({
    _id: { $in: exam.questions },
  }).lean();

  // Question গুলো map করো দ্রুত lookup এর জন্য
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let obtainedMarks = 0;
  let attemptedQuestions = 0;

  // প্রতিটা question এর answer process করো
  const processedAnswers = exam.questions.map((questionId: Types.ObjectId) => {
    const question = questionMap.get(questionId.toString());

    // User এই question এর জন্য কোন answer দিয়েছে
    const userAnswer = answers.find(
      (a) => a.questionId === questionId.toString(),
    );

    const selectedOptionId = userAnswer?.selectedOptionId || null;

    // Answer না দিলে skip
    if (!selectedOptionId || !question) {
      return {
        questionId,
        selectedOptionId: null,
        isCorrect: false,
      };
    }

    attemptedQuestions++;

    // Correct option খুঁজে বের করো
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

    // Question এর stats update করো
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
    };
  });

  const scorePercentage =
    exam.totalQuestions > 0
      ? Math.round((correctAnswers / exam.totalQuestions) * 100)
      : 0;

  // Exam update করো
  const updatedExam = await ExamAttemptModel.findByIdAndUpdate(
    examId,
    {
      answers: processedAnswers,
      correctAnswers,
      incorrectAnswers,
      attemptedQuestions,
      obtainedMarks,
      scorePercentage,
      timeSpentSeconds,
      status: "submitted",
      submittedAt: new Date(),
    },
    { new: true },
  );

  return updatedExam;
};

// ─────────────────────────────────────────────
// Submit এর পর full result দেখো
// প্রতিটা question এর explanation + option stats সহ
// ─────────────────────────────────────────────
export const getExamResultService = async (
  examId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const exam = await ExamAttemptModel.findOne({
    _id: examId,
    userId,
  }).lean();

  if (!exam) {
    throw new Error("Exam not found");
  }

  if (exam.status !== "submitted") {
    throw new Error("Exam has not been submitted yet");
  }

  // সব question এর details আনো
  const questions = await QuestionModel.find({
    _id: { $in: exam.questions },
  }).lean();

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  // Answer map করো
  const answerMap = new Map(
    exam.answers.map((a: any) => [a.questionId.toString(), a]),
  );

  // প্রতিটা question এর সাথে user answer + explanation যোগ করো
  const detailedResults = exam.questions.map((questionId: any, index: any) => {
    const question = questionMap.get(questionId.toString());
    const userAnswer = answerMap.get(questionId.toString());

    return {
      serialNumber: index + 1,
      questionId,
      questionText: question?.questionText,
      explanation: question?.explanation,
      selectedOptionId: (userAnswer as any)?.selectedOptionId ?? null,
      isCorrect: (userAnswer as any)?.isCorrect ?? false,
      options: question?.options.map((opt) => ({
        _id: opt._id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        selectedCount: opt.selectedCount ?? 0,
      })),
    };
  });

  return {
    examSummary: {
      _id: exam._id,
      examName: exam.examName,
      topicId: exam.topicId,
      totalQuestions: exam.totalQuestions,
      attemptedQuestions: exam.attemptedQuestions,
      correctAnswers: exam.correctAnswers,
      incorrectAnswers: exam.incorrectAnswers,
      scorePercentage: exam.scorePercentage,
      totalMarks: exam.totalMarks,
      obtainedMarks: exam.obtainedMarks,
      timeLimitMinutes: exam.timeLimitMinutes,
      timeSpentSeconds: exam.timeSpentSeconds,
      startedAt: exam.startedAt,
      submittedAt: exam.submittedAt,
    },
    detailedResults,
  };
};

// ─────────────────────────────────────────────
// User এর সব exam history দেখো
// ─────────────────────────────────────────────
export const getExamHistoryService = async (userId: Types.ObjectId) => {
  const exams = await ExamAttemptModel.find({
    userId,
    status: "submitted",
  })
    .select(
      "examName topicId totalQuestions correctAnswers incorrectAnswers scorePercentage obtainedMarks totalMarks timeSpentSeconds submittedAt",
    )
    .sort({ submittedAt: -1 })
    .lean();

  return exams;
};
