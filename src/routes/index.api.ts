import express from "express";
const router = express.Router();
import auth from "../modules/auth/auth.route";



router.use("/auth",auth );

export default router;
