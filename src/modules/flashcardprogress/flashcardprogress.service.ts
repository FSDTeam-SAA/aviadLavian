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

/**
 * Convert custom interval string (e.g. "5m", "3d", "2h") to days
 */


/**
 * Format time difference for early review message
 */
const formatRemainingTime = (diffMs: number): string => {
  const totalSeconds = Math.ceil(diffMs / 1000);

  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return [
    days ? `${days} day(s)` : "",
    hours ? `${hours} hour(s)` : "",
    minutes ? `${minutes} minute(s)` : "",
    seconds ? `${seconds} second(s)` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

/**
 * Format a date nicely for response message
 */
const formatNextReviewTime = (date: Date): string => {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

/**
 * Get base interval in days
 * correct = 2 day
 * wrong = 2 minute
 * unknown = 10 minute
 */
const getBaseIntervalByResult = (result: ReviewResult): number => {
  switch (result) {
    case "correct":
      return 2; // 2 days
    case "wrong":
      return 2 / (24 * 60); // 2 minutes in days
    case "unknown":
      return 10 / (24 * 60); // 10 minutes in days
    default:
      return 0;
  }
};

const formatInterval = (interval: number): string => {
  const totalMinutes = interval * 24 * 60;

  if (totalMinutes >= 1440) {
    const days = totalMinutes / 1440;
    return `${days} day(s)`;
  }

  if (totalMinutes >= 60) {
    const hours = totalMinutes / 60;
    return `${hours} hour(s)`;
  }

  return `${Math.round(totalMinutes)} minute(s)`;
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
  if (!flashcard) {
    throw new CustomError(404, "Flashcard not found");
  }

  // Fetch user progress
  let progress = await FlashcardProgressModel.findOne({ userId, flashcardId });
  let isNew = false;
  const now = new Date();

  // Prevent early review
  if (progress?.nextReviewAt && now < progress.nextReviewAt) {
    const diffMs = progress.nextReviewAt.getTime() - now.getTime();
    const waitMessage = formatRemainingTime(diffMs);

    throw new CustomError(
      400,
      `You must wait ${waitMessage} before you can review this flashcard again.`
    );
  }

  // Create progress if first time
  if (!progress) {
    progress = new FlashcardProgressModel({
      userId,
      flashcardId,
      reviewCount: 0,
    });
    isNew = true;
  }

  /**
   * reviewCount meaning:
   * 1st allowed review  => multiplier 1
   * 2nd allowed review  => multiplier 2
   * 3rd allowed review  => multiplier 4
   * 4th allowed review  => multiplier 8
   */
  const nextReviewCount = (progress.reviewCount || 0) + 1;
  const multiplier = Math.pow(2, nextReviewCount - 1);

  let interval = 0;

  // Optional custom interval support
  if (customInterval) {
    const parsedCustomInterval = parseInterval(customInterval);
    if (parsedCustomInterval > 0) {
      interval = parsedCustomInterval;
    }
  }

  // Use system interval if custom interval not provided
  if (!interval) {
    const baseInterval = getBaseIntervalByResult(result);
    interval = baseInterval * multiplier;
  }

  // Keep old repetition logic if you still want it
  let repetitions = progress.repetitions || 0;
  if (quality === 5) repetitions += 1;
  else if (quality === 1) repetitions = 0;

  const easeFactor = progress.easeFactor || 2.5;
  const nextReviewAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  // Save progress
  progress.reviewCount = nextReviewCount;
  progress.repetitions = repetitions;
  progress.interval = interval;
  progress.easeFactor = easeFactor;
  progress.lastQuality = quality;
  progress.lastReviewedAt = now;
  progress.nextReviewAt = nextReviewAt;
  progress.userAnswer = result;

  await progress.save();

  const reviewAfter = formatInterval(interval);

  return {
    progress,
    message: `${isNew ? "Flashcard progress created" : "Flashcard progress updated"
      }. You can review this flashcard again after ${reviewAfter}. Next review at ${formatNextReviewTime(nextReviewAt)}.`,
    details: {
      canReview: true,
      nextReviewAt,
      reviewCount: nextReviewCount,
      appliedMultiplier: multiplier,
    },
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