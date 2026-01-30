import express from "express";

import { authGuard } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/multer.midleware";
import { forgetPassword, generateAccessToken, login, logout, registration, resetPassword, updateUser, verifyEmail } from "./user.controller";

const router = express.Router();

router.route("/register").post(registration);
router.route("/verify-email").post(authGuard,verifyEmail);
router.route("/login").post(login);
router
  .route("/update-user")
  .patch(
    authGuard,
    upload.fields([{ name: "image", maxCount: 1 }]),
    updateUser
  );
router.route("/logout").post(logout);
router.route("/forget-password").post(forgetPassword);
router.route("/reset-password").post(resetPassword);

//regenerate access token by using refresh token
router.route("/generate-access-token").post(generateAccessToken);

export default router;
