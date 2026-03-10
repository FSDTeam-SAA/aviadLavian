import { Router } from "express";
import {
  getQuestionsByTopic,
  getQuestionDetails,
  attemptQuestion,
  getAttemptByTopicController,
  questionBankEntryController,
} from "./questionbank.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = Router();

router.get("/question-bank-entry", authGuard, questionBankEntryController);
// Topic এর সব question আনো (serial number সহ)
router.get("/topics/:topicId/questions", authGuard, getQuestionsByTopic);

// Specific question এর details + explanation + option stats
router.get("/questions/:questionId", authGuard, getQuestionDetails);

// Question attempt করো
router.post("/questions/:questionId/attempt", authGuard, attemptQuestion);


router.get(
  "/topics/:topicId/attempt",
  authGuard, // ensure user is authenticated
  getAttemptByTopicController,
);
const questionBankRoutes = router;
export default questionBankRoutes;
