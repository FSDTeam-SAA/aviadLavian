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
  getStudentProgress,
  getAllUsers,
  getMyProfile,
} from "./user.controller";
import { allowRole, authGuard } from "../../middleware/auth.middleware";
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
import { permission } from "../../middleware/permission.middleware";

const router = Router();
// auth
router.post(
  "/register-user",
  validateRequest(registerUserSchema),
  registration,
);

router.post("/login", validateRequest(loginSchema), login);
router.post("/get-all-users", authGuard, allowRole("admin"), getAllUsers);


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

router.route("/get-my-profile").get(authGuard, getMyProfile);

router
  .route("/update-user")
  .patch(
    authGuard,
    upload.single("image"),
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
router.route("/verify-email").post(verifyEmail);


//students progress
router.route("/dashboard-leaderboard").get(getStudentProgress);
export const userRoute = router;
