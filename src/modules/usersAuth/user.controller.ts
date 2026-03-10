// modules/user/user.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

import {
  accountVerifyTemplate,
  forgotPasswordOtpTemplate,
  resetPasswordLinkTemplate,
} from "../../tempaletes/auth.templates";
import { mailer } from "../../helpers/nodeMailer";
import config from "../../config";
import { userService } from "./user.service";
import { QuestionBankAttemptModel } from "../questionbank/questionbank.models";

export const registration = asyncHandler(async (req, res) => {
  const user = await userService.registerUser(req.body);
  const verificationTemplate = accountVerifyTemplate(
    user.FirstName,
    user.verificationOtp,
  );

  setImmediate(async () => {
    await mailer({
      subject: "Verify Your Account",
      template: verificationTemplate,
      email: user.email,
    });
  });
  const { password, verificationOtp, ...rest } = user.toObject();

  ApiResponse.sendSuccess(res, 201, "User registered successfully", {
    rest,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await userService.verifyEmail(req.body.email, req.body.otp);

  ApiResponse.sendSuccess(res, 200, "Email verified", {
    email: user.email,
    name: `${user.FirstName} ${user.LastName}`,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await userService.login(
    req.body.email,
    req.body.password,
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "none",
  });

  if (config.env === "development") {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none",
    });
  }

  ApiResponse.sendSuccess(res, 200, "Logged in", {
    email: user.email,
    role: user.role,
    name: `${user.FirstName} ${user.LastName}`,
    accessToken,
    refreshToken,
  });
});

//get all users by admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const { data , meta} = await userService.getAllUsers(req);
  ApiResponse.sendSuccess(res, 200, "Users fetched successfully", data, meta);
});

//get single user
export const getSingleUser = asyncHandler(async (req, res) => {
  const user = await userService.getSingleUser(req);
  ApiResponse.sendSuccess(res, 200, "User fetched successfully", user);
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getMyProfile(req);
  ApiResponse.sendSuccess(res, 200, "User fetched successfully", user);
});

//update status by admin account atatus
export const updateUserByID = asyncHandler(async (req, res) => {

  const result = await userService.updateUserByID(req);
  ApiResponse.sendSuccess(res, 200, "User status updated successfully", result);
});

export const updateUser = asyncHandler(async (req, res) => {

  const result = await userService.updateUser(req);


  ApiResponse.sendSuccess(res, 200, "User updated successfully", result);
});
// Controller
export const updatePassword = asyncHandler(async (req, res) => {
  const currentEmail = req?.user?.email as string;

  // Get access token
  const accessToken =
    req.cookies?.accessToken || req.headers?.authorization?.split("Bearer ")[1];

  await userService.changePassword(
    currentEmail,
    req.body.currentPassword,
    req.body.newPassword,
    accessToken,
  );

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");

  ApiResponse.sendSuccess(
    res,
    200,
    "Password changed successfully. Please login again.",
    {
      forceLogout: true,
    },
  );
});
export const logout = asyncHandler(async (req, res) => {
  // Get access token from cookies or headers
  const accessToken =
    req.cookies?.accessToken || req.headers?.authorization?.split("Bearer ")[1];

  await userService.logout(req.body.email, accessToken);

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");

  ApiResponse.sendSuccess(res, 200, "Logged out", {});
});

//delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req);
  ApiResponse.sendSuccess(res, 200, "User deleted successfully", result);
});

//delete user by id for admin
export const deleteUserByID = asyncHandler(async (req, res) => {
  const result = await userService.deleteUserByID(req);
  ApiResponse.sendSuccess(res, 200, "User deleted successfully", result);
});


// user.controller.ts
export const forgetPassword = asyncHandler(async (req, res) => {

  await userService.forgetPassword(req.body.email);

  ApiResponse.sendSuccess(
    res,
    200,
    "Reset OTP and link sent to your email",
    {},
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const { otp } = req.body;
  const { email } = req.body;

  await userService.resetPassword(token as string, otp, password, email);

  ApiResponse.sendSuccess(res, 200, "Password reset successful", {});
});

export const generateAccessToken = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.headers.refreshtoken?.toString().split("Bearer ")[1];

  const accessToken = await userService.generateAccessToken(refreshToken);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "none",
  });

  ApiResponse.sendSuccess(res, 200, "New access token generated", accessToken);
});


//TODO: Show all user progress for admin dashboard based on lesson history and quizes progress.

export const getStudentProgress = asyncHandler(async (req, res) => {
  const result = await QuestionBankAttemptModel.aggregate([
    {
      $group: {
        _id: "$userId",
        totalAttempts: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: 0,
        totalAttempts: 1,
        userId: "$_id",
        name: {
          $concat: ["$user.FirstName", " ", "$user.LastName"],
        },
        profileImage: "$user.profileImage",
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: result,
  });
});