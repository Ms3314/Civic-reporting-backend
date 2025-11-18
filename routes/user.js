import express from "express";
import { UserController } from "../controller/userController.js";
import { IssueController } from "../controller/issueController.js";

const userRouter = express.Router();

// Authentication routes
userRouter.post("/auth/login/request-otp", UserController.requestLoginOtp);
userRouter.post("/auth/login/verify-otp", UserController.verifyLoginOtp);

// Issue routes
userRouter.post("/issues", IssueController.createIssue);
userRouter.get("/issues", IssueController.getIssues);
userRouter.get("/issues/:id", IssueController.getIssueById);

export default userRouter;
