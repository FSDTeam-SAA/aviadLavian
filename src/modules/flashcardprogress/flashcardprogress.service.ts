import mongoose, { Types } from "mongoose";
import CustomError from "../../helpers/CustomError";
import { FlashcardModel } from "../flashcard/flashcard.models";
import { FlashcardProgressModel } from "./flashcardprogress.models";

type ReviewResult = "wrong" | "unknown" | "correct";

const QUALITY_MAP: Record<ReviewResult, number> = {
  wrong: 1,
  unknown: 3,
  correct: 5,
};

/**
 * Convert custom interval string (e.g., "5m", "3d") to days
 */
const parseInterval = (intervalStr: string): number => {
  const match = intervalStr.match(/^(\d+)([md])$/i);
  if (!match) return 0;

  const value = parseInt(match[1]!, 10);
  const unit = match[2]!.toLowerCase();

  if (unit === "m") return value / (24 * 60);
  if (unit === "h") return value / 24;
  if (unit === "d") return value;
  return 0;
};

// Review a flashcard and update spaced repetition progress
const reviewFlashcard = async (
  userId: string,
  flashcardId: string,
  result: ReviewResult,
  customInterval?: string
) => {
  const quality = QUALITY_MAP[result];


  // Check flashcard exists
  const flashcard = await FlashcardModel.findById(flashcardId);
  if (!flashcard) throw new CustomError(404, "Flashcard not found");

  // Fetch user progress
  let progress = await FlashcardProgressModel.findOne({ userId, flashcardId });
  let isNew = false;

  const now = new Date();

  // Prevent early review
  if (progress?.nextReviewAt && now < progress.nextReviewAt) {
    const diffMs = progress.nextReviewAt.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.ceil((diffMs % (1000 * 60)) / 1000);

    const waitMessage =
      (diffDays ? `${diffDays} day(s) ` : "") +
      (diffHours ? `${diffHours} hour(s) ` : "") +
      (diffMinutes ? `${diffMinutes} minute(s)` : "") +
      (diffSeconds ? `${diffSeconds} second(s)` : "");

    return {
      progress,
      message: `You cannot review this flashcard yet. Try again in ${waitMessage.trim()}`,
      canReview: false,
    };
  }

  // Create progress if first time
  if (!progress) {
    progress = new FlashcardProgressModel({ userId, flashcardId });
    isNew = true;
  }

  // Set interval
  let interval: number = 0;

  if (customInterval) {
    interval = parseInterval(customInterval);
  }


  //!If interval is not provided, use default based on quality 
  /**
 * @description Determine the default review interval when no interval is provided.
 */
  if (!interval) {
    if (quality === 5) interval = 5;
    else if (quality === 3) interval = 3;
    else interval = 5 / (24 * 60);
  }

  // Update repetitions
  let repetitions = progress.repetitions;
  if (quality === 5) repetitions += 1;
  else if (quality === 1) repetitions = 0;

  const easeFactor = progress.easeFactor || 2.5;

  const nextReviewAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  // Save progress
  progress.repetitions = repetitions;
  progress.interval = interval;
  progress.easeFactor = easeFactor;
  progress.lastQuality = quality;
  progress.lastReviewedAt = now;
  progress.nextReviewAt = nextReviewAt;
  progress.userAnswer = result;

  await progress.save();

  return {
    progress,
    message: isNew ? "Flashcard progress created" : "Flashcard progress updated",
    canReview: true,
    nextReviewAt,
  };
};


// Get all flashcard progress for a user
const getFlashcardProgressByTopic = async (userId: string, topicId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new CustomError(400, "Invalid userId");
  }

  if (!mongoose.Types.ObjectId.isValid(topicId)) {
    throw new CustomError(400, "Invalid topicId");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const topicObjectId = new mongoose.Types.ObjectId(topicId);

  const result = await FlashcardProgressModel.aggregate([
    {
      $match: {
        userId: userObjectId,
      },
    },
    {
      $lookup: {
        from: "flashcards",
        localField: "flashcardId",
        foreignField: "_id",
        as: "flashcardId",
      },
    },
    {
      $unwind: "$flashcardId",
    },
    {
      $match: {
        "flashcardId.topicId": topicObjectId,
      },
    },
    {
      $lookup: {
        from: "injuries",
        localField: "flashcardId.topicId",
        foreignField: "_id",
        as: "topicData",
      },
    },
    {
      $unwind: "$topicData",
    },
    {
      $group: {
        _id: "$topicData._id",
        topic: {
          $first: {
            _id: "$topicData._id",
            Id: "$topicData.Id",
            Name: "$topicData.Name",
            Primary_Body_Region: "$topicData.Primary_Body_Region",
            Secondary_Body_Region: "$topicData.Secondary_Body_Region",
            Acuity: "$topicData.Acuity",
            Image_URL: "$topicData.Image_URL",
          },
        },
        progressCount: { $sum: 1 },

        correctCount: {
          $sum: {
            $cond: [{ $eq: ["$userAnswer", "correct"] }, 1, 0],
          },
        },
        wrongCount: {
          $sum: {
            $cond: [{ $eq: ["$userAnswer", "wrong"] }, 1, 0],
          },
        },
        unknownCount: {
          $sum: {
            $cond: [{ $eq: ["$userAnswer", "unknown"] }, 1, 0],
          },
        },

        progress: {
          $push: {
            _id: "$_id",
            userId: "$userId",
            repetitions: "$repetitions",
            interval: "$interval",
            easeFactor: "$easeFactor",
            lastQuality: "$lastQuality",
            lastReviewedAt: "$lastReviewedAt",
            nextReviewAt: "$nextReviewAt",
            userAnswer: "$userAnswer",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
            flashcardId: {
              _id: "$flashcardId._id",
              question: "$flashcardId.question",
              answer: "$flashcardId.answer",
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: "flashcards",
        let: { currentTopicId: "$topic._id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$topicId", "$$currentTopicId"],
              },
            },
          },
          {
            $count: "totalFlashcards",
          },
        ],
        as: "flashcardStats",
      },
    },
    {
      $addFields: {
        totalFlashcards: {
          $ifNull: [{ $arrayElemAt: ["$flashcardStats.totalFlashcards", 0] }, 0],
        },
      },
    },
    {
      $project: {
        _id: 0,
        summary: {
          progressCount: "$progressCount",
          totalFlashcards: "$totalFlashcards",
          progressText: {
            $concat: [
              { $toString: "$progressCount" },
              " in progress of total ",
              { $toString: "$totalFlashcards" },
            ],
          },
          correct: "$correctCount",
          wrong: "$wrongCount",
          unknown: "$unknownCount",
        },
        topic: 1,
        progress: 1,
      },
    },
  ]);

  return (
    result[0] || {
      summary: {
        progressCount: 0,
        totalFlashcards: 0,
        progressText: "0 in progress of total 0",
        correct: 0,
        wrong: 0,
        unknown: 0,
      },
      topic: null,
      progress: [],
    }
  );
};

export const flashcardprogressService = {
  reviewFlashcard,
  getFlashcardProgressByTopic: getFlashcardProgressByTopic,
};