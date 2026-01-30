import { string } from "zod";

export enum role {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum status {
  active = "active",
  inactive = "inactive",
  blocked = "blocked",
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: role;
  profileImage: string[];
  status: status;
  isVerified: boolean;
  verificationOtp: number | null;
  refreshToken: string | null;
  emailOtp: number | null;
  emailOtpExpire: Date | null;
  forgetPasswordOtp: number | null;
  frogetPasswordOtpExpire: Date | null;
}
