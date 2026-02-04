import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";
import flashcardRoute from "../modules/flashcard/flashcard.routes";


router.use("/user", userRoute);
router.use("/flashcard", flashcardRoute);


export default router;
