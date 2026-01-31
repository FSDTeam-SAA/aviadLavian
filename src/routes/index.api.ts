import express from "express";
const router = express.Router();

import category from "../modules/category/category.route";
import { userRoute } from "../modules/usersAuth/user.route";

router.use("/category", category);
router.use("/user", userRoute);

export default router;
