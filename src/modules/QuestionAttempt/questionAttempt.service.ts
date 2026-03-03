import { CreateQuestionAttemptDto, TestModeResponse, TutorModeResponse } from "./questionAttempt.interface";
import { QuestionAttempt } from "./questionAttempt.model";


export class QuestionAttemptService {
  /**
   * Submit answer for a question
   * Returns different response based on exam mode (test/tutor)
   */
  static async submitAnswer(
    userId: string,
    dto: CreateQuestionAttemptDto,
  ): Promise<TutorModeResponse | TestModeResponse> {
    const {
      examAttemptId,
      questionId,
      selectedOption,
      timeSpent,
      isBookmarked,
    } = dto;

    // 1. Validate exam attempt exists and belongs to user
    const examAttempt =
      await ExamAttempt.findById(examAttemptId).populate("exam");

    if (!examAttempt) {
      throw new Error("Exam attempt not found");
    }

    if (examAttempt.user.toString() !== userId) {
      throw new Error("Unauthorized: This exam attempt does not belong to you");
    }

    if (examAttempt.isCompleted) {
      throw new Error("Cannot submit answer: Exam is already completed");
    }

    // 2. Validate question exists and belongs to this exam
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    const exam = examAttempt.exam as any;
    const examQuestionIds = exam.questions.map((q: any) => q.toString());

    if (!examQuestionIds.includes(questionId)) {
      throw new Error("Question does not belong to this exam");
    }

    // 3. Check if question already attempted
    const existingAttempt = await QuestionAttempt.findOne({
      examAttempt: examAttemptId,
      question: questionId,
    });

    if (existingAttempt) {
      throw new Error("Question already attempted");
    }

    // 4. Validate selected option
    if (selectedOption >= question.options.length || selectedOption < 0) {
      throw new Error(
        `Invalid option: must be between 0 and ${question.options.length - 1}`,
      );
    }

    // 5. Check if answer is correct
    const isCorrect = question.options[selectedOption].isCorrect;
    const marksObtained = isCorrect ? question.marks : -question.negativeMarks;

    // 6. Create question attempt
    const questionAttempt = await QuestionAttempt.create({
      examAttempt: examAttemptId,
      question: questionId,
      user: userId,
      selectedOption,
      isCorrect,
      marksObtained,
      timeSpent,
      isBookmarked: isBookmarked || false,
    });

    // 7. Update exam attempt total score
    examAttempt.totalScore += marksObtained;
    await examAttempt.save();

    // 8. Update question statistics
    await this.updateQuestionStats(questionId, selectedOption, isCorrect);

    // 9. Return response based on exam mode
    if (exam.config.mode === ExamMode.TUTOR) {
      // Tutor mode: Show everything immediately
      const correctOptionIndex = question.options.findIndex(
        (opt) => opt.isCorrect,
      );
      const stats = await this.getQuestionStats(questionId);

      return {
        isCorrect,
        correctOption: correctOptionIndex,
        explanation: question.explanation,
        stats,
      };
    } else {
      // Test mode: Only show if correct or not
      return {
        isCorrect,
      };
    }
  }

  /**
   * Update question statistics (for tutor mode display)
   */
  private static async updateQuestionStats(
    questionId: string,
    selectedOption: number,
    isCorrect: boolean,
  ): Promise<void> {
    const question = await Question.findById(questionId);

    if (!question) return;

    // Update total attempts
    question.stats.totalAttempts += 1;

    // Update correct attempts
    if (isCorrect) {
      question.stats.correctAttempts += 1;
    }

    // Update option selection count
    const currentCount =
      question.stats.optionSelectionCount.get(selectedOption.toString()) || 0;

    question.stats.optionSelectionCount.set(
      selectedOption.toString(),
      currentCount + 1,
    );

    await question.save();
  }

  /**
   * Get question statistics for tutor mode
   */
  static async getQuestionStats(questionId: string) {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    const totalAttempts = question.stats.totalAttempts || 0;
    const optionPercentages: { [key: number]: number } = {};

    if (totalAttempts > 0) {
      // Calculate percentage for each option
      question.options.forEach((_, index) => {
        const count =
          question.stats.optionSelectionCount.get(index.toString()) || 0;
        optionPercentages[index] = Math.round((count / totalAttempts) * 100);
      });
    }

    return {
      totalAttempts,
      correctAttempts: question.stats.correctAttempts || 0,
      accuracyRate:
        totalAttempts > 0
          ? Math.round((question.stats.correctAttempts / totalAttempts) * 100)
          : 0,
      optionPercentages,
    };
  }

  /**
   * Toggle bookmark status of a question attempt
   */
  static async toggleBookmark(
    userId: string,
    questionAttemptId: string,
    isBookmarked: boolean,
  ) {
    const questionAttempt = await QuestionAttempt.findById(questionAttemptId);

    if (!questionAttempt) {
      throw new Error("Question attempt not found");
    }

    if (questionAttempt.user.toString() !== userId) {
      throw new Error(
        "Unauthorized: This question attempt does not belong to you",
      );
    }

    questionAttempt.isBookmarked = isBookmarked;
    await questionAttempt.save();

    return questionAttempt;
  }

  /**
   * Get all bookmarked questions for a user
   */
  static async getBookmarkedQuestions(
    userId: string,
  ): Promise<BookmarkedQuestion[]> {
    const bookmarked = await QuestionAttempt.find({
      user: userId,
      isBookmarked: true,
    })
      .populate({
        path: "question",
        select: "questionText difficulty topic",
        populate: {
          path: "topic",
          select: "name",
        },
      })
      .sort({ attemptedAt: -1 });

    return bookmarked.map((attempt) => ({
      _id: attempt._id.toString(),
      question: {
        _id: (attempt.question as any)._id.toString(),
        questionText: (attempt.question as any).questionText,
        difficulty: (attempt.question as any).difficulty,
        topic: {
          _id: (attempt.question as any).topic._id.toString(),
          name: (attempt.question as any).topic.name,
        },
      },
      selectedOption: attempt.selectedOption,
      isCorrect: attempt.isCorrect,
      marksObtained: attempt.marksObtained,
      attemptedAt: attempt.attemptedAt,
    }));
  }

  /**
   * Get question attempts with filters
   */
  static async getQuestionAttempts(userId: string, query: GetAttemptsQuery) {
    const {
      examAttemptId,
      isBookmarked,
      isCorrect,
      page = 1,
      limit = 20,
    } = query;

    const filter: any = { user: userId };

    if (examAttemptId) {
      filter.examAttempt = examAttemptId;
    }

    if (isBookmarked !== undefined) {
      filter.isBookmarked = isBookmarked;
    }

    if (isCorrect !== undefined) {
      filter.isCorrect = isCorrect;
    }

    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      QuestionAttempt.find(filter)
        .populate("question", "questionText difficulty marks")
        .sort({ attemptedAt: -1 })
        .skip(skip)
        .limit(limit),
      QuestionAttempt.countDocuments(filter),
    ]);

    return {
      attempts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single question attempt by ID
   */
  static async getQuestionAttemptById(
    userId: string,
    questionAttemptId: string,
  ) {
    const attempt = await QuestionAttempt.findById(questionAttemptId).populate({
      path: "question",
      select: "questionText options explanation difficulty marks negativeMarks",
    });

    if (!attempt) {
      throw new Error("Question attempt not found");
    }

    if (attempt.user.toString() !== userId) {
      throw new Error(
        "Unauthorized: This question attempt does not belong to you",
      );
    }

    return attempt;
  }

  /**
   * Delete question attempt (only if exam not completed)
   */
  static async deleteQuestionAttempt(
    userId: string,
    questionAttemptId: string,
  ) {
    const questionAttempt = await QuestionAttempt.findById(questionAttemptId);

    if (!questionAttempt) {
      throw new Error("Question attempt not found");
    }

    if (questionAttempt.user.toString() !== userId) {
      throw new Error(
        "Unauthorized: This question attempt does not belong to you",
      );
    }

    // Check if exam is completed
    const examAttempt = await ExamAttempt.findById(questionAttempt.examAttempt);

    if (examAttempt?.isCompleted) {
      throw new Error("Cannot delete: Exam is already completed");
    }

    // Revert score from exam attempt
    if (examAttempt) {
      examAttempt.totalScore -= questionAttempt.marksObtained;
      await examAttempt.save();
    }

    // Delete the attempt
    await QuestionAttempt.findByIdAndDelete(questionAttemptId);

    return { message: "Question attempt deleted successfully" };
  }

  /**
   * Get user's attempt history for a specific question
   */
  static async getQuestionHistory(userId: string, questionId: string) {
    const attempts = await QuestionAttempt.find({
      user: userId,
      question: questionId,
    })
      .populate("examAttempt", "startedAt completedAt")
      .sort({ attemptedAt: -1 });

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter((a) => a.isCorrect).length;
    const averageTime =
      totalAttempts > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + a.timeSpent, 0) / totalAttempts,
          )
        : 0;

    return {
      totalAttempts,
      correctAttempts,
      accuracy:
        totalAttempts > 0
          ? Math.round((correctAttempts / totalAttempts) * 100)
          : 0,
      averageTime,
      attempts,
    };
  }
}
