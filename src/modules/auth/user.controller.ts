import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { userModel } from "./user.models";
import { accountVerifyTemplate, forgotPasswordOtpTemplate } from "./auth.templates";
import { mailer } from "../../helpers/nodeMailer";
import ApiResponse from "../../utils/apiResponse";
import CustomError from "../../helpers/CustomError";
import config from "../../config";
import { uploadCloudinary } from "../../helpers/cloudinary";
import crypto from "crypto";
import jwt from "jsonwebtoken";

interface authRequest extends Request {
  user: {
    email: string;
  };
}

//create user/register user
export const registration = asyncHandler(
  async (req: Request, res: Response) => {
    // create verification otp
    const verificationOtp = crypto.randomInt(100000, 999999);

    // create user with otp
    const user = await userModel.create({
      ...req.body,
      verificationOtp,
      verificationOtpExpires: Date.now() + 10 * 60 * 1000,
    });

    // remove sensitive fields
    const responseUser = await userModel
      .findById(user._id)
      .select("-password -refreshToken -verificationOtp");

    if (responseUser) {
      const verificationTemplate = accountVerifyTemplate(
        responseUser.name,
        verificationOtp
      );

      await mailer({
        subject: "Account Verification",
        template: verificationTemplate,
        email: responseUser.email,
      });
    }

    ApiResponse.sendSuccess(
      res,
      200,
      "User registered successfully",
      responseUser
    );
  }
);

//verify email
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const otp = req.body.otp;
  if (!otp) throw new CustomError(400, "Otp not found");

  const user = await userModel.findOne({
    email: (req as authRequest).user.email,
  });
  if (!user) throw new CustomError(400, "Email not found");

  if (user.isVerified) throw new CustomError(400, "Email already verified");

  if (user.verificationOtp !== otp) throw new CustomError(400, "Invalid otp");

  user.isVerified = true;
  user.verificationOtp = null;
  await user.save();

  ApiResponse.sendSuccess(res, 200, "Email verified successfully", {
    name: user.name,
    email: user.email,
  });
});

//login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) throw new CustomError(400, "Email or password invalid");

  const isMatch = await user.comparePassword(req.body.password);
  if (!isMatch) throw new CustomError(400, "Email or password invalid");

  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  //set cookie with refresh token
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "none",
  });

  if (config.env === "development") {
    //set access token in cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none",
    });
  }

  ApiResponse.sendSuccess(res, 200, "User logged in", {
    name: user.name,
    email: user.email,
    accesstoken: accessToken,
  });
});

//update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const values: { name?: string; status?: string } = req.body;

  // Find and  Update user
  const user = await userModel
    .findOneAndUpdate(
      { email: (req as authRequest).user.email },
      { $set: values },
      { new: true, runValidators: true }
    )
    .select("email name status profileImage");

  if (!user) {
    throw new CustomError(400, "Email not found");
  }

  /* ================= Handle image ================= */

  if (
    req.files &&
    !Array.isArray(req.files) &&
    req.files.image &&
    req.files.image.length > 0
  ) {
    let imagePath: any = req.files.image[0];
    const uploadedImage = await uploadCloudinary(imagePath.path);
    if (uploadedImage) {
      user.profileImage.push(uploadedImage);
      await user.save();
    }
  }

  ApiResponse.sendSuccess(res, 200, "User updated successfully", user);
});

//logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) throw new CustomError(400, "Email or password invalid");

  // update database refresh field
  user.refreshToken = "";
  await user.save();

  // clear cookie
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  ApiResponse.sendSuccess(res, 200, "User logged out", {});
});

//forget password
export const forgetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) throw new CustomError(400, "Email not found");

    // use crypto to generate otp
    const otp = crypto.randomInt(100000, 999999);

    // update database refresh field
    user.forgetPasswordOtp = otp;
    user.frogetPasswordOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // send email
    await mailer({
      subject: "Password Reset OTP",
      template: forgotPasswordOtpTemplate(user.name, otp.toString()),
      email: user.email,
    });

    ApiResponse.sendSuccess(res, 200, "Otp sent", {});
  }
);

//reset password
export const resetPassword = asyncHandler(
  async (
    req: Request<{}, {}, { otp: number; password: string; email: string }>,
    res: Response
  ) => {
    const { otp, password, email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "Email not found");

    if (!user.forgetPasswordOtp) throw new CustomError(400, "Otp not found");

    if ((user.frogetPasswordOtpExpire as any) < Date.now())
      throw new CustomError(400, "Otp expired");

    if (user.forgetPasswordOtp !== otp)
      throw new CustomError(400, "Invalid otp");

    // update database refresh field
    user.forgetPasswordOtp = null;
    user.frogetPasswordOtpExpire = null;
    user.password = password;
    await user.save();

    ApiResponse.sendSuccess(res, 200, "Password reset successfully", {});
  }
);

//generate access token by using refresh token

export const generateAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const authReq = req as authRequest;
    const refreshToken =
      req.cookies?.refreshToken ||
      (req.headers.refreshtoken as string | undefined)?.split("Bearer ")[1];

    if (!refreshToken) {
      throw new CustomError(401, "Unauthorized access!");
    }

    const decoded = jwt.verify(
      refreshToken,
      config.jwt.refreshTokenSecret
    ) as jwt.JwtPayload;
    if (!decoded || !decoded.userId) {
      throw new CustomError(401, "Invalid refresh token!");
    }

    const user = await userModel
      .findOne({ _id: decoded.userId })
      .select("email _id name role status");
    if (!user) throw new CustomError(400, "Email not found");

    authReq.user = user;
    const newAccessToken = user.createAccessToken();
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "none",
    });

    ApiResponse.sendSuccess(
      res,
      200,
      "New access token generated",
      newAccessToken
    );
  }
);
