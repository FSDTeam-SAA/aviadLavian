import express from "express";
const router = express.Router();

import subject from "../modules/subject/subject.route";
import label from "../modules/label/label.routes";
import { userRoute } from "../modules/usersAuth/user.route";

router.use("/user", userRoute);
router.use("/subject", subject);
router.use("/label", label);

export default router;
