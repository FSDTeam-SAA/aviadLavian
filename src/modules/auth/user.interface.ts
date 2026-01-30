export interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    profileImage: [
        {
            public_id: string;
            secure_url: string;
        }
    ];
    status: string;
    isVerified: boolean;
    verificationOtp: number | null;
    refreshToken: string | null;
    forgetPasswordOtp: number | null;
    frogetPasswordOtpExpire: Date | null;
    resetPassword:{
        otp: number | null;
        token: string | null;
        expireAt: Date | null;
    }
    comparePassword: (password: string) => Promise<boolean>;
    createAccessToken: () => string;
    createRefreshToken: () => string;
}