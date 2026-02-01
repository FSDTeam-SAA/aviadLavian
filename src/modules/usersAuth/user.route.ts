import { Router } from "express";
import {
  registration,
  login,
  logout,
  forgetPassword,
  resetPassword,
  generateAccessToken,
  updateUser,
  verifyEmail,
} from "./user.controller";
import { authGuard } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/multer.midleware";

const router = Router();
// auth
router.post("/register-user", registration);

router.post("/login", login);
router.post("/logout", logout);

// // password
// router.post("/forget-password", forgetPassword);
// router.post("/reset-password", resetPassword);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);

// token
router.post("/refresh-token", generateAccessToken);

router
  .route("/update-user")
  .patch(
    authGuard,
    upload.fields([{ name: "image", maxCount: 1 }]),
    updateUser,
  );

router.route("/verify-email").post(authGuard, verifyEmail);

export const userRoute = router;
