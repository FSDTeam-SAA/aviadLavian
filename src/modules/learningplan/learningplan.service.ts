import { Types } from "mongoose";
import { LearningPlanModel } from "./learningplan.model";
import { IGetAllLearningPlansParams } from "./learningplan.interface";
import CustomError from "../../helpers/CustomError";
import { paginationHelper } from "../../utils/pagination";
import { InjuryModel } from "../injury/injury.model";
import { QuestionModel } from "../Question/question.model";

// ── Population Options ──
const populationOptions = [
    {
        path: "flashcards.flashcardId",
        populate: {
            path: "topicId",
            model: "Injury",
        },
    },
    {
        path: "articles.articleId",
        populate: {
            path: "topicIds",
            model: "Injury",
        },
    },
    {
        path: "quizzes.quizId",
        populate: {
            path: "topicId",
            model: "Injury",
        },
    },
];

// ── Create ──
const createLearningPlan = async (
    userId: string,
    data: { name: string; description?: string }
) => {
    const plan = await LearningPlanModel.create({
        userId: new Types.ObjectId(userId),
        ...data,
    });
    if (!plan) throw new CustomError(400, "Learning plan not created");
    return plan;
};

// ── Get All (user-scoped) ──
const getAllLearningPlans = async (
    userId: string,
    params: IGetAllLearningPlansParams
) => {
    const { page, limit, sort = "decending", name } = params;
    const {
        limit: pageLimit,
        skip,
        page: currentPage,
    } = paginationHelper(page, limit);

    const query: any = {
        userId: new Types.ObjectId(userId),
        isActive: true,
    };
    if (name) {
        query.name = { $regex: name, $options: "i" };
    }

    const sortObj: any =
        sort === "accending" ? { createdAt: 1 } : { createdAt: -1 };

    const [plans, total] = await Promise.all([
        LearningPlanModel.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(pageLimit)
            .populate(populationOptions),
        LearningPlanModel.countDocuments(query),
    ]);

    const meta = {
        page: currentPage,
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit),
    };

    return { plans, meta };
};

// ── Get Single ──
const getSingleLearningPlan = async (userId: string, planId: string) => {
    const plan = await LearningPlanModel.findOne({
        _id: planId,
        userId: new Types.ObjectId(userId),
        isActive: true,
    }).populate(populationOptions);

    if (!plan) throw new CustomError(404, "Learning plan not found");
    return plan;
};

// ── Update Plan (name / description) ──
const updateLearningPlan = async (
    userId: string,
    planId: string,
    data: { name?: string; description?: string }
) => {
    const plan = await LearningPlanModel.findOneAndUpdate(
        { _id: planId, userId: new Types.ObjectId(userId), isActive: true },
        { $set: data },
        { new: true }
    );
    if (!plan) throw new CustomError(404, "Learning plan not found");
    return plan;
};

// ── Soft Delete ──
const deleteLearningPlan = async (userId: string, planId: string) => {
    const plan = await LearningPlanModel.findOneAndUpdate(
        { _id: planId, userId: new Types.ObjectId(userId), isActive: true },
        { $set: { isActive: false } },
        { new: true }
    );
    if (!plan) throw new CustomError(404, "Learning plan not found");
    return plan;
};

// ── Add Flashcard to Plan ──
const addFlashcardToPlan = async (
    userId: string,
    planId: string,
    flashcardData: {
        flashcardId: string;
        isAnswered?: string;
    }
) => {
    const plan = await LearningPlanModel.findOne({
        _id: planId,
        userId: new Types.ObjectId(userId),
        isActive: true,
    });
    if (!plan) throw new CustomError(404, "Learning plan not found");

    // Prevent duplicates
    const alreadyExists = plan.flashcards.some(
        (f: any) => f.flashcardId.toString() === flashcardData.flashcardId
    );
    if (alreadyExists) {
        throw new CustomError(400, "Flashcard already exists in this learning plan");
    }

    plan.flashcards.push({
        flashcardId: new Types.ObjectId(flashcardData.flashcardId),
        isAnswered: (flashcardData.isAnswered as any) || "unanswered",
        answeredAt: null,
    });

    await plan.save();

    // Return with populated flashcard details
    const populated = await LearningPlanModel.findById(plan._id).populate(
        populationOptions
    );
    return populated;
};

// ── Update Flashcard Progress ──
const updateFlashcardProgress = async (
    userId: string,
    planId: string,
    flashcardId: string,
    progressData: { isAnswered: string }
) => {
    const plan = await LearningPlanModel.findOne({
        _id: planId,
        userId: new Types.ObjectId(userId),
        isActive: true,
    });
    if (!plan) throw new CustomError(404, "Learning plan not found");

    const entry = plan.flashcards.find(
        (f: any) => f.flashcardId.toString() === flashcardId
    );
    if (!entry) {
        throw new CustomError(404, "Flashcard not found in this learning plan");
    }

    entry.isAnswered = progressData.isAnswered as any;
    entry.answeredAt = ["incorrect", "unsure", "correct"].includes(
        progressData.isAnswered
    )
        ? new Date()
        : null;

    await plan.save();

    const populated = await LearningPlanModel.findById(plan._id).populate(
        populationOptions
    );
    return populated;
};

// ── Remove Flashcard from Plan ──
const removeFlashcardFromPlan = async (
    userId: string,
    planId: string,
    flashcardId: string
) => {
    const plan = await LearningPlanModel.findOneAndUpdate(
        {
            _id: planId,
            userId: new Types.ObjectId(userId),
            isActive: true,
        },
        {
            $pull: { flashcards: { flashcardId: new Types.ObjectId(flashcardId) } },
        },
        { new: true }
    ).populate(populationOptions);

    if (!plan) throw new CustomError(404, "Learning plan not found");
    return plan;
};

// ── Add Article to Plan ──
const addArticleToPlan = async (
    userId: string,
    planId: string,
    articleData: {
        articleId: string;
        isRead?: string;
    }
) => {
    const plan = await LearningPlanModel.findOne({
        _id: planId,
        userId: new Types.ObjectId(userId),
        isActive: true,
    });
    if (!plan) throw new CustomError(404, "Learning plan not found");

    // Prevent duplicates
    const alreadyExists = plan.articles.some(
        (a: any) => a.articleId.toString() === articleData.articleId
    );
    if (alreadyExists) {
        throw new CustomError(400, "Article already exists in this learning plan");
    }

    plan.articles.push({
        articleId: new Types.ObjectId(articleData.articleId),
        isRead: (articleData.isRead as any) || "unread",
        readAt: null,
    });

    await plan.save();

    const populated = await LearningPlanModel.findById(plan._id).populate(
        populationOptions
    );
    return populated;
};

// ── Update Article Progress ──
const updateArticleProgress = async (
    userId: string,
    planId: string,
    articleId: string,
    progressData: { isRead: string }
) => {
    const plan = await LearningPlanModel.findOne({
        _id: planId,
        userId: new Types.ObjectId(userId),
        isActive: true,
    });
    if (!plan) throw new CustomError(404, "Learning plan not found");

    const entry = plan.articles.find(
        (a: any) => a.articleId.toString() === articleId
    );
    if (!entry) {
        throw new CustomError(404, "Article not found in this learning plan");
    }

    entry.isRead = progressData.isRead as any;
    entry.readAt = progressData.isRead === "read" ? new Date() : null;

    await plan.save();

    const populated = await LearningPlanModel.findById(plan._id).populate(
        populationOptions
    );
    return populated;
};

// ── Remove Article from Plan ──
const removeArticleFromPlan = async (
    userId: string,
    planId: string,
    articleId: string
) => {
    const plan = await LearningPlanModel.findOneAndUpdate(
        {
            _id: planId,
            userId: new Types.ObjectId(userId),
            isActive: true,
        },
        {
            $pull: { articles: { articleId: new Types.ObjectId(articleId) } },
        },
        { new: true }
    ).populate(populationOptions);

    if (!plan) throw new CustomError(404, "Learning plan not found");
    return plan;
};

// ── Add Quiz (Questions by Region) to Plan ──
const addQuizToPlan = async (
    userId: string,
    planId: string,
    data: { primaryBodyRegion: string }
) => {
    const plan = await LearningPlanModel.findOne({
        _id: planId,
        userId: new Types.ObjectId(userId),
        isActive: true,
    });
    if (!plan) throw new CustomError(404, "Learning plan not found");

    // 1. Find Injury matching the primary body region
    const injury = await InjuryModel.findOne({
        Primary_Body_Region: new RegExp(`^${data.primaryBodyRegion}$`, "i"),
    });
    if (!injury) {
        throw new CustomError(
            404,
            `No injury found for region: ${data.primaryBodyRegion}`
        );
    }

    // 2. Find Questions by topicId (string matching primaryBodyRegion)
    const questions = await QuestionModel.find({
        topicId: data.primaryBodyRegion,
        isDeleted: false,
    });

    if (questions.length > 0) {
        // 3. Update those questions' topicId to Injury ObjectId
        await QuestionModel.updateMany(
            { topicId: data.primaryBodyRegion },
            { $set: { topicId: injury._id } }
        );
    }

    // 4. Find all questions for this injury (including any previously updated)
    const updatedQuestions = await QuestionModel.find({
        topicId: injury._id,
        isDeleted: false,
    });

    if (updatedQuestions.length === 0) {
        throw new CustomError(
            404,
            `No questions found for region: ${data.primaryBodyRegion}`
        );
    }

    // 5. Add to learning plan quizzes
    for (const q of updatedQuestions) {
        const alreadyExists = plan.quizzes.some(
            (quiz: any) => quiz.quizId.toString() === q._id.toString()
        );
        if (!alreadyExists) {
            plan.quizzes.push({
                quizId: q._id as Types.ObjectId,
                isAnswered: "unanswered",
                answeredAt: null,
            });
        }
    }

    await plan.save();

    const populated = await LearningPlanModel.findById(plan._id).populate(
        populationOptions
    );
    return populated;
};

// ── Update Quiz Progress ──
const updateQuizProgress = async (
    userId: string,
    planId: string,
    quizId: string,
    progressData: { isAnswered: string }
) => {
    const plan = await LearningPlanModel.findOne({
        _id: planId,
        userId: new Types.ObjectId(userId),
        isActive: true,
    });
    if (!plan) throw new CustomError(404, "Learning plan not found");

    const entry = plan.quizzes.find(
        (q: any) => q.quizId.toString() === quizId
    );
    if (!entry) {
        throw new CustomError(404, "Quiz question not found in this learning plan");
    }

    entry.isAnswered = progressData.isAnswered as any;
    entry.answeredAt = ["incorrect", "unsure", "correct"].includes(
        progressData.isAnswered
    )
        ? new Date()
        : null;

    await plan.save();

    const populated = await LearningPlanModel.findById(plan._id).populate(
        populationOptions
    );
    return populated;
};

// ── Remove Quiz from Plan ──
const removeQuizFromPlan = async (
    userId: string,
    planId: string,
    quizId: string
) => {
    const plan = await LearningPlanModel.findOneAndUpdate(
        {
            _id: planId,
            userId: new Types.ObjectId(userId),
            isActive: true,
        },
        {
            $pull: { quizzes: { quizId: new Types.ObjectId(quizId) } },
        },
        { new: true }
    ).populate(populationOptions);

    if (!plan) throw new CustomError(404, "Learning plan not found");
    return plan;
};

export const learningPlanService = {
    createLearningPlan,
    getAllLearningPlans,
    getSingleLearningPlan,
    updateLearningPlan,
    deleteLearningPlan,
    addFlashcardToPlan,
    updateFlashcardProgress,
    removeFlashcardFromPlan,
    addArticleToPlan,
    updateArticleProgress,
    removeArticleFromPlan,
    addQuizToPlan,
    updateQuizProgress,
    removeQuizFromPlan,
};
