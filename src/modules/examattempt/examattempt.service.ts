import { Types } from "mongoose";
import { QuestionModel } from "../Question/question.model";
import { ExamAttemptModel } from "./examattempt.models";
import { userModel } from "../usersAuth/user.models";

export const startExamService = async (
  userId: Types.ObjectId,
  topicId: string,
  examName: string,
  timeLimitMinutes: number = 120,
) => {
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

  const questionLimit = Math.min(60, allQuestions.length);

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

  const questions = await QuestionModel.find({
    _id: { $in: exam.questions },
  })
    .select("-__v")
    .lean();

  const questionsWithSerial = questions.map((question, index) => ({
    serialNumber: index + 1,
    ...question,
    options: question.options.map((opt) => ({
      _id: opt._id,
      text: opt.text,
      selectedCount: opt.selectedCount,
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

  const questions = await QuestionModel.find({
    _id: { $in: exam.questions },
  }).lean();

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let obtainedMarks = 0;
  let attemptedQuestions = 0;

  const processedAnswers = exam.questions.map((questionId: Types.ObjectId) => {
    const question = questionMap.get(questionId.toString());

    const userAnswer = answers.find(
      (a) => a.questionId === questionId.toString(),
    );

    const selectedOptionId = userAnswer?.selectedOptionId || null;

    if (!selectedOptionId || !question) {
      return {
        questionId,
        selectedOptionId: null,
        isCorrect: false,
      };
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

  const questions = await QuestionModel.find({
    _id: { $in: exam.questions },
  }).lean();

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  const answerMap = new Map(
    exam.answers.map((a: any) => [a.questionId.toString(), a]),
  );

  // Total user count
  const allUserCount = await userModel.countDocuments({});

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
      options: question?.options.map((opt) => {
        const selectedCount = opt.selectedCount ?? 0;
        const selectedPercentage =
          allUserCount > 0
            ? Math.round((selectedCount / allUserCount) * 100)
            : 0;

        return {
          _id: opt._id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          selectedCount,
          selectedPercentage,
        };
      }),
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

export const getExamResultByQuestionIdService = async (
  examId: Types.ObjectId,
  userId: Types.ObjectId,
  questionId: Types.ObjectId,
) => {

  const exam = await ExamAttemptModel.findOne({
    _id: examId,
    userId,
  }).lean();

  if (!exam) throw new Error("Exam not found");
  if (exam.status !== "submitted")
    throw new Error("Exam has not been submitted yet");


  const question = await QuestionModel.findById(questionId).lean();
  if (!question) throw new Error("Question not found");


  const userAnswer = exam.answers.find(
    (a: any) => a.questionId.toString() === questionId.toString(),
  );


  const allUserCount = await userModel.countDocuments({});

  const options = question.options.map((opt) => {
    const selectedCount = opt.selectedCount ?? 0;
    const selectedPercentage =
      allUserCount > 0 ? Math.round((selectedCount / allUserCount) * 100) : 0;

    return {
      _id: opt._id,
      text: opt.text,
      isCorrect: opt.isCorrect,
      selectedCount,
      selectedPercentage,
    };
  });


  return {
    examId: exam._id,
    examName: exam.examName,
    topicId: exam.topicId,
    questionId: question._id,
    questionText: question.questionText,
    explanation: question.explanation,
    selectedOptionId: userAnswer?.selectedOptionId ?? null,
    isCorrect: userAnswer?.isCorrect ?? false,
    options,
    marks: question.marks ?? 1,
  };
};
