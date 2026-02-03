import express from "express";
import { createLabel, deleteLabel, getAllLabel, getSingleLabel, updateLabel } from "./label.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createLabelSchema, updateLabelSchema } from "./label.validation";
import { uploadSingle } from "../../middleware/multer.midleware";
import { allowRole, authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/create-label", authGuard, allowRole("admin"), uploadSingle("image"), validateRequest(createLabelSchema), createLabel);
router.get("/get-label/:labelId", authGuard, allowRole("admin", "user"), getSingleLabel);
router.get("/get-all-label", getAllLabel);
router.patch("/update-label/:labelId",authGuard, allowRole("admin"), uploadSingle("image"), validateRequest(updateLabelSchema), updateLabel);
router.delete("/delete-label/:labelId",authGuard, allowRole("admin"), deleteLabel);

export default router;
