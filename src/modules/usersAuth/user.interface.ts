export enum role {
  ADMIN = "admin",
  USER = "user",
}

export enum status {
  active = "active",
  inactive = "inactive",
  blocked = "blocked",
}
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  profession?: string;
  country?: string;
  password?: string;
}
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  profession: string;
  profileImage: [
    {
      public_id: string;
      secure_url: string;
    },
  ];
  status: status;
  country: string;
  addressIds?: string[];
  passwordResetToken: string;
  passwordResetExpire: Date | null;
  isVerified: boolean;
  isDeleted: boolean;
  verificationOtp: number | null;
  verificationOtpExpire: Date | null;
  refreshToken: string | null;
  forgetPasswordOtp: number | null;
  frogetPasswordOtpExpire: Date | null;
  resetPassword: {
    otp: number | null;
    token: string | null;
    expireAt: Date | null;
  };
  comparePassword: (password: string) => Promise<boolean>;
  createAccessToken: () => string;
  createRefreshToken: () => string;
}
