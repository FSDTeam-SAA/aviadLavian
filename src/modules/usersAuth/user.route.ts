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
  updateStatus,
  getSingleUser,
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
  updateStatusSchema,
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
router.get("/get-all-users", authGuard, allowRole("admin"), getAllUsers);
router.get("/get-single-user/:userId", authGuard, allowRole("admin"), getSingleUser);


router.post("/logout", authGuard, logout);

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
// Update status
router.route("/update-status/:userId").patch(authGuard, allowRole("admin"), validateRequest(updateStatusSchema), updateStatus );

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
