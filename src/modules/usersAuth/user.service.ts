// modules/user/user.service.ts
import { userModel } from "./user.models";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import CustomError from "../../helpers/CustomError";
import config from "../../config";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import { IUser, UpdateUserPayload } from "./user.interface";
import bcryptjs from "bcryptjs";
// import { redisTokenService } from "../../helpers/redisTokenService";
import { emailValidator } from "../../helpers/emailValidator";
import { generateOTP } from "../../utils/otpGenerator";
import { mailer } from "../../helpers/nodeMailer";
import {
  forgotPasswordOtpTemplate,
  forgotPasswordUnifiedTemplate,
} from "../../tempaletes/auth.templates";
import { paginationHelper } from "../../utils/pagination";

export const userService = {
  async registerUser(payload: Partial<IUser>) {
    if (payload.role === "admin")
      throw new CustomError(400, "Admin role is reserved");
    if (payload.email) {
      emailValidator(payload.email);
    }

    const adminEmails = config.adminEmails;
    console.log(adminEmails);
    const role = adminEmails.includes(payload.email!) ? "admin" : "user";
    const getOtp = generateOTP();
    const otp = Number(getOtp);
    // const role = "user";
    const user = await userModel.create({
      ...payload,
      role: role,
      verificationOtp: otp as number,
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
    const user = await userModel.findOne({ email, isDeleted: false });
    if (!user) throw new CustomError(400, "user not found");

    const isPasswordMatch = await bcryptjs.compare(password, user.password);
    if (!isPasswordMatch) throw new CustomError(400, "incorrect password");

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  },

  //get all users
  async getAllUsers(req: any) {
    const { page: pageParam, limit: limitParam, search, filter } = req.query;

    const { page, limit, skip } = paginationHelper(pageParam, limitParam);

    const query: any = { role: "user" };
    const andConditions: any[] = [];

    //serach
    if (search) {
      andConditions.push({
        $or: [
          { FirstName: { $regex: search, $options: "i" } },
          { LastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      });
    }

    //filter
    const allowedStatus = ["active", "deactive", "blocked"];
    const allowedBoolean = ["true", "false"];

    if (filter) {
      const conditions: any[] = [];

      if (allowedStatus.includes(filter)) {
        conditions.push({ status: filter });
      }

      if (allowedBoolean.includes(filter)) {
        conditions.push({ isVerified: filter === "true" });
      }

      if (conditions.length === 0) {
        throw new CustomError(
          400,
          "Invalid filter. Allowed values: active, deactive, blocked, true, false"
        );
      }

      andConditions.push({ $or: conditions });
    }

    if (andConditions.length) {
      query.$and = andConditions;
    }

    const users = await userModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .select("email country FirstName LastName profileImage role");

    const totalUsers = await userModel.countDocuments(query);

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      data: users,
      meta: {
        page,
        limit,
        totalUsers,
        totalPages,
      },
    };
  },

  //get single user
  async getSingleUser(req: any) {
    const { userId } = req.params
    const user = await userModel.findOne({ _id: userId }).select("FirstName LastName country address instituteName idNumber registrationNumber dateOfBirth email profileImage status email isVerified");
    return user;
  },

  //grt my profile
  async getMyProfile(req: any) {
    const user = await userModel.findOne({ _id: req.user._id }).select("FirstName LastName country address instituteName idNumber registrationNumber dateOfBirth email profileImage status email");
    return user;
  },

  //update user profile as my profile
  async updateUser(req: any) {
    const image = req.file as Express.Multer.File;

    const role = req.user?.role;

    // role-based allowed status
    const userAllowedStatus = ["active", "deactive"];
    const adminAllowedStatus = ["active", "deactive", "blocked"];

    if (req.body.status) {
      const allowedStatus =
        role === "admin" ? adminAllowedStatus : userAllowedStatus;

      if (!allowedStatus.includes(req.body.status)) {
        throw new CustomError(
          403,
          `Invalid status. Allowed values: ${allowedStatus.join(", ")}`
        );
      }
    }

    const user = await userModel
      .findOneAndUpdate(
        { _id: req.user._id },
        req.body,
        { new: true }
      )
      .select(
        "FirstName LastName country address instituteName idNumber registrationNumber dateOfBirth email profileImage status"
      );

    if (!user) throw new CustomError(400, "User not found");

    if (image) {
      if (user.profileImage?.public_id) {
        await deleteCloudinary(user.profileImage.public_id);
      }

      const imageAsset = await uploadCloudinary(image.path);

      if (imageAsset) {
        user.profileImage = {
          public_id: imageAsset.public_id,
          secure_url: imageAsset.secure_url,
        };

        await user.save();
      }
    }

    return user;
  },

  //update status any user by admin only
  async updateUserByID(req: any) {
    const { userId } = req.params
const image = req.file as Express.Multer.File;

    const user = await userModel.findOneAndUpdate({ _id: userId, isDeleted: false }, req.body, { new: true }).select("FirstName LastName country address instituteName idNumber registrationNumber dateOfBirth email profileImage status email");
    if (!user) throw new CustomError(400, "User not found");

    if (image) {
      if (user.profileImage?.public_id) {
        await deleteCloudinary(user.profileImage.public_id);
      }

      const imageAsset = await uploadCloudinary(image.path);

      if (imageAsset) {
        user.profileImage = {
          public_id: imageAsset.public_id,
          secure_url: imageAsset.secure_url,
        };

        await user.save();
      }
    }

    return user
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
      // try {
      //   await redisTokenService.blacklistToken(accessToken);
      // } catch (error) {
      //   console.error("Failed to blacklist token:", error);
      // }
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

    //TODO: Blacklist the access token is disable for now, but it should be enabled when deployed
    // if (accessToken) {
    //   try {
    //     // await redisTokenService.blacklistToken(accessToken);
    //   } catch (error) {
    //     console.error("Failed to blacklist token:", error);
    //     // Don't throw error - logout should still succeed
    //   }
    // }
  },


  //delete user
  async deleteUser(req: any) {
    const user = await userModel.findOneAndDelete({ _id: req.user._id });
    return user;
  },

  async forgetPassword(email: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, "User not found");

    const resetToken = crypto.randomBytes(32).toString("hex");

    console.log("resetToken", resetToken);
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    console.log("hashedToken", hashedToken);
    const otp = Number(generateOTP());

    const expireTime = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpire = expireTime;
    user.forgetPasswordOtp = otp;
    user.frogetPasswordOtpExpire = expireTime;

    await user.save({ validateBeforeSave: false });

    const fullName = `${user.FirstName} ${user.LastName}`;
    const resetUrl = `http://localhost:5000/api/v1/auth/reset-password?token=${resetToken}`;
    const template = forgotPasswordUnifiedTemplate(fullName, otp, resetUrl);

    setImmediate(async () => {
      try {
        await mailer({
          email: user.email,
          subject: "Reset Your Password - Medical Education Platform",
          template: template,
        });
      } catch (error) {
        console.error("Email sending failed:", error);
      }
    });

    return { user };
  },
  async resetPassword(
    token: string,
    otp: number,
    newPassword: string,
    email: string,
  ) {
    console.log("token", token);
    if (token !== ":token") {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      console.log("hashedToken", hashedToken);

      const user = await userModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpire: { $gt: Date.now() },
      });

      if (!user) throw new CustomError(400, "Token or OTP invalid/expired");

      // Password reset
      user.password = newPassword;
      user.passwordResetToken = "";
      user.passwordResetExpire = null;
      user.forgetPasswordOtp = null;
      user.frogetPasswordOtpExpire = null;
      user.refreshToken = ""; // sob session revoke

      await user.save();
      return true;
    } else {
      const user = await userModel
        .findOne({ email })
        .select("forgetPasswordOtp frogetPasswordOtpExpire email ");
      if (!user) throw new CustomError(400, "User not found");
      console.log("otpss", user.forgetPasswordOtp);
      if (user.forgetPasswordOtp !== otp)
        throw new CustomError(400, "OTP invalid/expiredsadfgds");

      // check time
      if (user.frogetPasswordOtpExpire!.getTime() < Date.now()) {
        throw new CustomError(400, "OTP expired");
      }

      // Password reset
      user.password = newPassword;
      user.forgetPasswordOtp = null;
      user.frogetPasswordOtpExpire = null;
      user.refreshToken = ""; // sob session revoke

      await user.save();
      return true;
    }
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
