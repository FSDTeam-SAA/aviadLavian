import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";
import CustomError from "./CustomError";

dotenv.config();

// Create transporter
const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  secure: process.env.NODE_ENV === "production" ? true : false,
  auth: {
    user: process.env.HOST_MAIL as string,
    pass: process.env.APP_PASSWORD as string,
  },
});

interface MailerOptions {
  subject: string;
  template: string;
  email: string;
}

export const mailer = async ({
  subject,
  template,
  email,
}: MailerOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"VIRUS COMPUTER" <${process.env.HOST_MAIL}>`,
      to: email,
      subject,
      html: template,
    });
  } catch (error: unknown) {
    throw new CustomError(501, "Mail send failed", error);
  }
};
