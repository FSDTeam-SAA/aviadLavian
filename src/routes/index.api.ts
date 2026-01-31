import express from "express";
const router = express.Router();

import category from "../modules/subject/subject.route";
import subCategory from "../modules/subcategory/subcategory.routes";
import { userRoute } from "../modules/usersAuth/user.route";

router.use("/user", userRoute);
router.use("/category", category);
router.use("/subcategory", subCategory);

export default router;
