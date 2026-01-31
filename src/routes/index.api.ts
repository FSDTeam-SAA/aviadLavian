import express from "express";
const router = express.Router();
import auth from "../modules/auth/auth.route";
import category from "../modules/category/category.route";
import { userRoute } from "../modules/users/user.route";

router.use("/auth", auth);
router.use("/category", category);
router.use("/user", userRoute);

export default router;
