import express from "express";
const router = express.Router();
import auth from "../modules/auth/auth.route";
import category from "../modules/category/category.route";



router.use("/auth", auth);
router.use("/category", category);

export default router;
