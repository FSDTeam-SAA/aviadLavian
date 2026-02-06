import { Router } from "express";
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  hideQuestion,
  unhideQuestion,
} from "./question.controller";
import { allowRole} from "../../middleware/auth.middleware";

const router = Router();

router.post("/", allowRole("admin"), createQuestion);
router.get("/", allowRole("admin"), getAllQuestions);
router.get("/:id", allowRole("admin"), getQuestionById);
router.patch("/:id", allowRole("admin"), updateQuestion);
router.delete("/:id", allowRole("admin"), deleteQuestion);

router.patch("/:id/hide", allowRole("admin"), hideQuestion);
router.patch("/:id/unhide", allowRole("admin"), unhideQuestion);

export default router;
