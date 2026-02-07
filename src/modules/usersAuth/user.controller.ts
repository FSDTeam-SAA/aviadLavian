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

export const registration = asyncHandler(async (req, res) => {
  const user = await userService.registerUser(req.body);

  const verificationTemplate = accountVerifyTemplate(
    user.name,
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
  const user = await userService.verifyEmail(
    req?.user?.email as string,
    req.body.otp,
  );

  ApiResponse.sendSuccess(res, 200, "Email verified", {
    email: user.email,
    name: user.name,
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
    name: user.name,
    accessToken,
    refreshToken,
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const currentEmail = req?.user?.email as string;

  const result = await userService.updateUser(
    currentEmail,
    req.body,
    req.files,
  );

  if (result.emailChanged) {
    return ApiResponse.sendSuccess(
      res,
      200,
      "Email updated successfully. Please login again.",
      {
        forceLogout: true,
      },
    );
  }

  ApiResponse.sendSuccess(res, 200, "User updated successfully", result.user);
});
// Controller
export const updatePassword = asyncHandler(async (req, res) => {
  const currentEmail = req?.user?.email as string;

  await userService.changePassword(
    currentEmail,
    req.body.currentPassword,
    req.body.newPassword,
  );

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
  await userService.logout(req.body.email);

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");

  ApiResponse.sendSuccess(res, 200, "Logged out", {});
});

// user.controller.ts
export const forgetPassword = asyncHandler(async (req, res) => {
  const { resetToken, user } = await userService.forgetPassword(req.body.email);

  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  await mailer({
    email: user.email,
    subject: "Reset your password",
    template: resetPasswordLinkTemplate(user.name, resetUrl),
  });

  ApiResponse.sendSuccess(res, 200, "Reset link sent to email", {});
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  await userService.resetPassword(token as string, password);

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
