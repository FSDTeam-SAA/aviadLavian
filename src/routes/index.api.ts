import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";
import flashcardRoute from "../modules/flashcard/flashcard.routes";
import { questionRoute } from "../modules/Question/question.route";

router.use("/user", userRoute);
router.use("/flashcard", flashcardRoute);
router.use("/question", questionRoute);

export default router;
