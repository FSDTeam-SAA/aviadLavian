import express from "express";

import { authGuard } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/multer.midleware";

const router = express.Router();

// router.route("/register").post(registration);


export default router;
