import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";
import subject from "../modules/subject/subject.route";
import label from "../modules/label/label.routes";
import topic from "../modules/topic/topic.routes";

router.use("/user", userRoute);
router.use("/subject", subject);
router.use("/label", label);
router.use("/topic", topic);

export default router;
