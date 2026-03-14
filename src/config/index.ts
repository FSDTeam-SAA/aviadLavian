import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  /* ================= Server ================= */
  env: process.env.NODE_ENV === "development" ? "development" : "production",
  port: Number(process.env.PORT) || 5000,

  /* ================= admin email ================= */
  adminEmails: process.env.ADMIN_EMAILS?.split(",") || [],
  /* ================= Database ================= */
  mongoUri: process.env.MONGO_URI as string,

  /* ================= Security ================= */
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

  /* ================= JWT ================= */
  jwt: {
    jwtSecret: process.env.JWT_SECRET as string,
    jwtExpire: process.env.JWT_EXPIRE ?? "1h",

    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES ?? "10d",

    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES ?? "15d",
  },

  /* ================= Cloudinary ================= */
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    apiSecret: process.env.CLOUDINARY_API_SECRET as string,
  },

  /* ================= Email (Nodemailer) ================= */
  email: {
    hostMail: process.env.HOST_MAIL as string,
    appPassword: process.env.APP_PASSWORD as string,
  },

  /* ================= Stripe ================= */
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY as string,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
  },

  /* ================= Frontend ================= */
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",

  /* ================= Rate Limit ================= */
  rateLimit: {
    window: process.env.RATE_LIMIT_WINDOW ?? "15m",
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    delay: Number(process.env.RATE_LIMIT_DELAY) || 50,
  },

  /* ================= Redis ================= */
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
};

export default config;
