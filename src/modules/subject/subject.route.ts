import express from "express";
import { uploadSingle } from "../../middleware/multer.midleware";
import { createSubject, getAllSubject, getSingleSubject, updateSubject, deleteSubject
 } from "./subject.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createSubjectSchema, updateSubjectSchema } from "./subject.validation";
import { authGuard, allowRole } from "../../middleware/auth.middleware";

const router = express.Router();

router.route("/create-subject").post(authGuard, allowRole("admin"), uploadSingle("image"), validateRequest(createSubjectSchema), createSubject);
router.route("/get-all-subjects").get(getAllSubject);
router.route("/get-single-subject/:subjectId").get(authGuard, allowRole("admin", "user"), getSingleSubject);
router.route("/update-subject/:subjectId").patch(authGuard, allowRole("admin"), uploadSingle("image"), validateRequest(updateSubjectSchema), updateSubject);
router.route("/delete-subject/:subjectId").delete(authGuard, allowRole("admin"), deleteSubject);


export default router;
