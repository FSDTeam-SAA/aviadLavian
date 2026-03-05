import { email, z } from "zod";

export const registerUserSchema = z
  .object({
    FirstName: z.string().min(1, "First name is required").trim(),
    LastName: z.string().min(1, "Last name is required").trim(),
    email: z.email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password too long"),
    profession: z.string().min(1, "Profession is required"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    otp: z
      .number()
      .int("OTP must be a number")
      .min(100000, "OTP must be 6 digits")
      .max(999999, "OTP must be 6 digits"),
  })
  .strict();

export const forgetPasswordSchema = z
  .object({
    email: z.email("Invalid email"),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password too long"),
    otp: z
      .number()
      .int("OTP must be a number")
      .min(100000, "OTP must be 6 digits")
      .max(999999, "OTP must be 6 digits"),
    email: z.email("Invalid email"),
  })
  .strict();

// export const refreshTokenSchema = z
//   .object({
//     refreshToken: z.string().min(1, "Refresh token required").optional(),
//   })
//   .strict();

export const updateUserSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    profession: z.string().min(1, "Profession cannot be empty").optional(),
    country: z.string().min(1, "Country cannot be empty").optional(),
    email: z.email("Invalid email format").optional(),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(100, "New password is too long"),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });
