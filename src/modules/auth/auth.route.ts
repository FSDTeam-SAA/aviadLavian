import express from "express";

import { authGuard } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/multer.midleware";
import {
  updateUser,
  verifyEmail,
} from "../users/user.controller";

const router = express.Router();
router.route("/verify-email").post(authGuard, verifyEmail);
router
  .route("/update-user")
  .patch(
    authGuard,
    upload.fields([{ name: "image", maxCount: 1 }]),
    updateUser,
  );

export default router;
