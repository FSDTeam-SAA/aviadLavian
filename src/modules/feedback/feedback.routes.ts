import { Router } from "express";
import {
  submitFeedback,
  getMyFeedbacks,
  getFeedbackById,
  getAllFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats,
  getFeedbackByUser,
} from "./feedback.controller";
import { allowRole, authGuard } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", authGuard, submitFeedback);

router.get("/my", authGuard, getMyFeedbacks);

router.get("/:id", authGuard, getFeedbackById);

const adminRouter = Router();

// admin
adminRouter.get("/stats", authGuard, allowRole("admin"), getFeedbackStats);

adminRouter.get("/", authGuard, allowRole("admin"), getAllFeedbacks);

adminRouter.patch("/:id", authGuard, allowRole("admin"), updateFeedbackStatus);

adminRouter.delete("/:id", authGuard, allowRole("admin"), deleteFeedback);
adminRouter.get(
  "/singleUser/:userId",
  authGuard,
  allowRole("admin"),
  getFeedbackByUser,
);


export { router as feedbackRouter, adminRouter as adminFeedbackRouter };
