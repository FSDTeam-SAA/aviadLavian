import { Types } from "mongoose";
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

  if (unit === "m") return value / (24 * 60); // minutes to days
  if (unit === "d") return value; // days
  return 0;
};

/**
 * Review a flashcard and update spaced repetition progress
 */
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

    const waitMessage =
      (diffDays ? `${diffDays} day(s) ` : "") +
      (diffHours ? `${diffHours} hour(s) ` : "") +
      (diffMinutes ? `${diffMinutes} minute(s)` : "");

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

  if (!interval) {
    if (quality === 5) interval = 5; // correct → 5 days
    else if (quality === 3) interval = 3; // unknown → 3 days
    else interval = 5 / (24 * 60); // wrong → 5 minutes
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

  await progress.save();

  return {
    progress,
    message: isNew ? "Flashcard progress created" : "Flashcard progress updated",
    canReview: true,
    nextReviewAt,
  };
};

export const flashcardprogressService = {
  reviewFlashcard,
};