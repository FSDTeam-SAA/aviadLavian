import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";


router.use("/user", userRoute);


export default router;
