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
  updatePassword,
} from "./user.controller";
import { authGuard } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/multer.midleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import {
  changePasswordSchema,
  forgetPasswordSchema,
  loginSchema,
  registerUserSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "./user.validation";

const router = Router();
// auth
router.post(
  "/register-user",
  validateRequest(registerUserSchema),
  registration,
);

router.post("/login", validateRequest(loginSchema), login);
router.post("/logout", authGuard, logout);

// // password
// router.post("/forget-password", forgetPassword);
// router.post("/reset-password", resetPassword);
router.post(
  "/forget-password",
  validateRequest(forgetPasswordSchema),
  forgetPassword,
);
router.post(
  "/reset-password/:token",
  validateRequest(resetPasswordSchema),
  resetPassword,
);

// token
router.post(
  "/refresh-token",

  generateAccessToken,
);

router
  .route("/update-user")
  .patch(
    authGuard,
    upload.fields([{ name: "image", maxCount: 1 }]),
    validateRequest(updateUserSchema),
    updateUser,
  );
// Route
router.patch(
  "/change-password",
  authGuard,
  validateRequest(changePasswordSchema),
  updatePassword,
);
router.route("/verify-email").post(authGuard, verifyEmail);

export const userRoute = router;
