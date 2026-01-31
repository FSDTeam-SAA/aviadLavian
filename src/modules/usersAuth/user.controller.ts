// modules/user/user.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

import {
  accountVerifyTemplate,
  forgotPasswordOtpTemplate,
} from "../../tempaletes/auth.templates";
import { mailer } from "../../helpers/nodeMailer";
import config from "../../config";
import { userService } from "./user.service";

interface AuthRequest extends Request {
  user: { email: string };
}

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

  ApiResponse.sendSuccess(res, 200, "User registered successfully", {
    rest,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await userService.verifyEmail(
    (req as AuthRequest).user.email,
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
    accessToken,
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(
    (req as AuthRequest).user.email,
    req.body,
    req.files,
  );

  ApiResponse.sendSuccess(res, 200, "User updated", user);
});

export const logout = asyncHandler(async (req, res) => {
  await userService.logout(req.body.email);

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");

  ApiResponse.sendSuccess(res, 200, "Logged out", {});
});

export const forgetPassword = asyncHandler(async (req, res) => {
  const { user, otp } = await userService.forgetPassword(req.body.email);

  await mailer({
    subject: "Password Reset OTP",
    template: forgotPasswordOtpTemplate(user.name, otp.toString()),
    email: user.email,
  });

  ApiResponse.sendSuccess(res, 200, "Otp sent", {});
});

export const resetPassword = asyncHandler(async (req, res) => {
  await userService.resetPassword(
    req.body.email,
    req.body.otp,
    req.body.password,
  );

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
