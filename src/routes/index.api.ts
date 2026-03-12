import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";
import flashcardRoute from "../modules/flashcard/flashcard.routes";
import { questionRoute } from "../modules/Question/question.route";
import injuryRoute from "../modules/injury/injury.routes";
import { articleRoutes } from "../modules/Article/article.route";
import { flashcardprogressRoute } from "../modules/flashcardprogress/flashcardprogress.routes";

import questionBankRoutes from "../modules/questionbank/questionbank.routes";
import examAttemptRoutes from "../modules/examattempt/examattempt.routes";
import quizRoutes from "../modules/quiz/quiz.routes";
import { learningPlanRoute } from "../modules/learningplan/learningplan.route";
import { ArticleAnnotationRoute } from "../modules/ArticleAnnotation/articleAnnotation.route";
import { progressRoute } from "../modules/progress/progress.routes";

router.use("/user", userRoute);
router.use("/flashcard", flashcardRoute);
router.use("/flashcard-progress", flashcardprogressRoute);
router.use("/question", questionRoute);

router.use("/injury", injuryRoute);
router.use("/article", articleRoutes);
router.use("/article-annotations", ArticleAnnotationRoute);
router.use("/learning-plan", learningPlanRoute);


// Questions and quiz
router.use("/questionbank", questionBankRoutes);
router.use("/examattempt", examAttemptRoutes);
router.use("/quiz", quizRoutes);


//progress for admin and user
router.use("/progress", progressRoute);



export default router;
