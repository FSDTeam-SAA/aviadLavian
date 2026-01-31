// modules/user/user.service.ts
import { userModel } from "./user.models";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import CustomError from "../../helpers/CustomError";
import config from "../../config";
import { uploadCloudinary } from "../../helpers/cloudinary";
import { IUser } from "./user.interface";
import bcryptjs from "bcryptjs";

export const userService = {
  async registerUser(payload: Partial<IUser>) {
    const verificationOtp = crypto.randomInt(100000, 999999);
    const { password } = payload;
    const hashedPassword = await bcryptjs.hash(password as string, 10);
    const user = await userModel.create({
      ...payload,
      password: hashedPassword,
      verificationOtp,
    });

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

  async updateUser(email: string, values: any, files?: any) {
    const user = await userModel
      .findOneAndUpdate(
        { email },
        { $set: values },
        { new: true, runValidators: true },
      )
      .select("email name status profileImage");

    if (!user) throw new CustomError(400, "Email not found");

    if (files?.image?.length > 0) {
      const uploaded = await uploadCloudinary(files.image[0].path);
      if (uploaded) {
        user.profileImage.push(uploaded);
        await user.save();
      }
    }

    return user;
  },

  async logout(email: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "Email not found");

    user.refreshToken = "";
    await user.save();
  },

  async forgetPassword(email: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "Email not found");

    const otp = crypto.randomInt(100000, 999999);
    user.forgetPasswordOtp = otp;
    user.frogetPasswordOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return { user, otp };
  },

  async resetPassword(email: string, otp: number, password: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "Email not found");

    if (!user.forgetPasswordOtp) throw new CustomError(400, "Otp not found");
    if ((user.frogetPasswordOtpExpire as any) < Date.now())
      throw new CustomError(400, "Otp expired");
    if (user.forgetPasswordOtp !== otp)
      throw new CustomError(400, "Invalid otp");

    user.password = password;
    user.forgetPasswordOtp = null;
    user.frogetPasswordOtpExpire = null;
    await user.save();
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

    const accessToken = user.createAccessToken();
    return accessToken;
  },
};
