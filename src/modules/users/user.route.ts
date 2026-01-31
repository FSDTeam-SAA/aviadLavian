import { Router } from "express";
import {
  registration,
  login,
  logout,
  forgetPassword,
  resetPassword,
  generateAccessToken,
} from "./user.controller";

const router = Router();
// auth
router.post("/register-user", registration);

router.post("/login", login);
router.post("/logout", logout);

// password
router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);

// token
router.post("/refresh-token", generateAccessToken);

export const userRoute = router;
