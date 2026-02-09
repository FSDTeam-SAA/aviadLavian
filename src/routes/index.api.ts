import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";
import flashcardRoute from "../modules/flashcard/flashcard.routes";
import { questionRoute } from "../modules/Question/question.route";
import injuryRoute from "../modules/injury/injury.routes";
import flashcardProgressRoute from "../modules/flashcardprogress/flashcardprogress.routes";


router.use("/user", userRoute);
router.use("/flashcard", flashcardRoute);
router.use("/question", questionRoute);

router.use("/injury", injuryRoute);

router.use("/flashcard-progress", flashcardProgressRoute);


export default router;
