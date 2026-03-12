import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { userModel } from "../usersAuth/user.models";
import { QuestionModel } from "../Question/question.model";
import { FlashcardModel } from "../flashcard/flashcard.models";
import { ArticleModel } from "../Article/article.model";
import { QuizModel } from "../quiz/quiz.models";
import { Types } from "mongoose";
import CustomError from "../../helpers/CustomError";
import { IUser } from "../usersAuth/user.interface";
import { IProgressOverview, ITopStudentQuery, ITopStudentResponse } from "./progress.interface";

const getProgressOverview = async (
  user: IUser
): Promise<IProgressOverview> => {
  const { _id, role } = user;

  if (!_id || !Types.ObjectId.isValid(_id)) {
    throw new CustomError(400, "Invalid user id");
  }

  console.log(user);
  

  const userId = new Types.ObjectId(_id);

  if (role === "admin") {
    const [totalUsers, totalArticles, totalQuestions] = await Promise.all([
      userModel.countDocuments({}),
      ArticleModel.countDocuments({ isActive: true }),
      QuestionModel.countDocuments({ isHidden: false, isDeleted: false }),
    ]);

    return {
      totalUsers,
      totalArticles,
      totalQuestions,
    };
  }

  const [totalQuiz, totalQuestions, totalFlashcards] = await Promise.all([
    QuizModel.countDocuments({ userId, status: "submitted" }),
    QuestionModel.countDocuments({ isHidden: false, isDeleted: false }),
    FlashcardModel.countDocuments({ isActive: true }),
  ]);

  return {
    totalQuiz,
    totalQuestions,
    totalFlashcards,
  };
};


//get top performing students
const getTopPerformingStudents = async (
  query: ITopStudentQuery
): Promise<ITopStudentResponse> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 5;
  const skip = (page - 1) * limit;

  const userMatch = {
    role: "user",
    isDeleted: false,
    status: { $ne: "blocked" },
  };

  const total = await userModel.countDocuments(userMatch);

  const data = await userModel.aggregate([
    {
      $match: userMatch,
    },
    {
      $lookup: {
        from: "quizzes",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$userId", "$$userId"] },
              status: "submitted",
            },
          },
          {
            $project: {
              totalQuestions: 1,
              scorePercentage: 1,
            },
          },
        ],
        as: "quizData",
      },
    },
    {
      $addFields: {
        name: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ["$FirstName", ""] },
                " ",
                { $ifNull: ["$LastName", ""] },
              ],
            },
          },
        },
        profileImage: {
          $ifNull: ["$profileImage.secure_url", null],
        },
        totalQuizzes: { $size: "$quizData" },
        totalQuestions: {
          $sum: "$quizData.totalQuestions",
        },
        performance: {
          $round: [
            {
              $ifNull: [{ $avg: "$quizData.scorePercentage" }, 0],
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        profileImage: 1,
        totalQuizzes: 1,
        totalQuestions: 1,
        performance: 1,
      },
    },
    {
      $sort: {
        performance: -1,
        totalQuizzes: -1,
        totalQuestions: -1,
        createdAt: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

export const ProgressService = {
  getProgressOverview, getTopPerformingStudents
};