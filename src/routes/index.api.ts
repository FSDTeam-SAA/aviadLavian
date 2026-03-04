import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";
import flashcardRoute from "../modules/flashcard/flashcard.routes";
import { questionRoute } from "../modules/Question/question.route";
import injuryRoute from "../modules/injury/injury.routes";
import { articleRoutes } from "../modules/Article/article.route";
import { flashcardprogressRoute } from "../modules/flashcardprogress/flashcardprogress.routes";


router.use("/user", userRoute);
router.use("/flashcard", flashcardRoute);
router.use("/flashcard-progress", flashcardprogressRoute);
router.use("/question", questionRoute);

router.use("/injury", injuryRoute);


router.use("/article", articleRoutes);


export default router;
