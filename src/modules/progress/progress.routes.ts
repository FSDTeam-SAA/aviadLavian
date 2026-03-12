import express from "express";
import { getProgressOverview, getTopPerformingStudents } from "./progress.controller";
import { allowRole, authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

//TODO: customize as needed

router.get("/", authGuard, getProgressOverview);
router.get("/top-performing-students", authGuard, allowRole("admin"), getTopPerformingStudents);

export const progressRoute = router;
