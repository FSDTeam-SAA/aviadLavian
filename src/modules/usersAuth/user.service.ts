// modules/user/user.service.ts
import { userModel } from "./user.models";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import CustomError from "../../helpers/CustomError";
import config from "../../config";
import { uploadCloudinary } from "../../helpers/cloudinary";
import { IUser, UpdateUserPayload } from "./user.interface";
import bcryptjs from "bcryptjs";
import { redisTokenService } from "../../helpers/redisTokenService";

export const userService = {
  async registerUser(payload: Partial<IUser>) {
    if (payload.role === "admin")
      throw new CustomError(400, "Admin role is reserved");

    const adminEmails = config.adminEmails;
    console.log(adminEmails);
    const role = adminEmails.includes(payload.email!) ? "admin" : "user";
    // const role = "user";
    const user = await userModel.create({ ...payload, role: role });

    return user;
  },

  async verifyEmail(email: string, otp: number) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "Email not found");
    if (user.isVerified) throw new CustomError(400, "Email already verified");
    if (user.verificationOtp !== otp) throw new CustomError(400, "Invalid otp");

    user.isVerified = true;
    user.verificationOtp = null;
    await user.save();

    return user;
  },

  async login(email: string, password: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "user not found");

    const isPasswordMatch = await bcryptjs.compare(password, user.password);
    if (!isPasswordMatch) throw new CustomError(400, "incorrect password");

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  },

  async updateUser(email: string, payload: UpdateUserPayload, files?: any) {
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new CustomError(404, "User not found");
    }

    let emailChanged = false;

    if (payload.name) user.name = payload.name;
    if (payload.profession) user.profession = payload.profession;
    if (payload.country) user.country = payload.country;

    // change email
    if (payload.email && payload.email !== user.email) {
      const exists = await userModel.findOne({
        email: payload.email,
      });

      if (exists) {
        throw new CustomError(409, "Email already in use");
      }

      user.email = payload.email;
      emailChanged = true;

      // force logout
      user.refreshToken = null;
    }

    if (files?.image?.length > 0) {
      const uploaded = await uploadCloudinary(files.image[0].path);
      if (uploaded) {
        user.profileImage.push(uploaded);
      }
    }

    await user.save();

    return {
      user: {
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
      emailChanged,
    };
  },
  // Service
  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
    accessToken?: string,
  ) {
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new CustomError(404, "User not found");
    }

    await user.changePassword(currentPassword, newPassword);

    // Revoke all sessions
    user.refreshToken = "";
    await user.save();

    // ✅ Blacklist current access token
    if (accessToken) {
      try {
        await redisTokenService.blacklistToken(accessToken);
      } catch (error) {
        console.error("Failed to blacklist token:", error);
      }
    }

    return true;
  },

  async logout(email: string, accessToken?: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "Email not found");

    // Clear refresh token from database
    user.refreshToken = "";
    await user.save();

    // ✅ NEW: Blacklist the access token if provided
    if (accessToken) {
      try {
        await redisTokenService.blacklistToken(accessToken);
      } catch (error) {
        console.error("Failed to blacklist token:", error);
        // Don't throw error - logout should still succeed
      }
    }
  },

  async forgetPassword(email: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "User not found");

    // generate random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // hash token before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await user.save({ validateBeforeSave: false });

    return {
      resetToken, // 👉 only send plain token via email
      user,
    };
  },
  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) throw new CustomError(400, "Token invalid or expired");

    user.password = newPassword;
    user.passwordResetToken = "";
    user.passwordResetExpire = null;
    user.refreshToken = ""; // revoke all sessions

    await user.save();

    return true;
  },
  async generateAccessToken(refreshToken: string) {
    const decoded = jwt.verify(
      refreshToken,
      config.jwt.refreshTokenSecret,
    ) as jwt.JwtPayload;

    if (!decoded?.userId) {
      throw new CustomError(401, "Invalid refresh token");
    }

    const user = await userModel.findById(decoded.userId);
    if (!user) throw new CustomError(400, "User not found");
    if (user.refreshToken !== refreshToken) {
      throw new CustomError(401, "Invalid refresh token");
    }
    const accessToken = user.createAccessToken();
    return accessToken;
  },
};
