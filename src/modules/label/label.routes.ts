import express from "express";
import { createLabel, deleteLabel, getAllLabel, getSingleLabel, updateLabel } from "./label.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createLabelSchema, updateLabelSchema } from "./label.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

router.post("/create-label", uploadSingle("image"), validateRequest(createLabelSchema), createLabel);
router.get("/get-label/:labelId", getSingleLabel);
router.get("/get-all-label", getAllLabel);
router.patch("/update-label/:labelId", uploadSingle("image"), validateRequest(updateLabelSchema),  updateLabel);
router.delete("/delete-label/:labelId",  deleteLabel);

export default router;
