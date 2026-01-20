import express from "express";
import { UserController } from "../controller/userController.js";
import { IssueController } from "../controller/issueController.js";
import { CommentController } from "../controller/commentController.js";
import { RepostController } from "../controller/repostController.js";
import { CategoryController } from "../controller/categoryController.js";
import { authenticate, requireUser } from "../middleware/auth.js";

const userRouter = express.Router();

// Authentication routes
userRouter.post("/request-otp", UserController.requestLoginOtp);
userRouter.post("/verify-otp", UserController.verifyLoginOtp);

// Category routes (public - no auth required)
userRouter.get("/categories", CategoryController.getCategories);
userRouter.get("/categories/:id", CategoryController.getCategoryById);

// Issue routes (protected - require user authentication)
userRouter.post("/issues", authenticate, requireUser, IssueController.createIssue);
userRouter.get("/issues", authenticate, requireUser, IssueController.getIssues);
userRouter.get("/issues/my-issues", authenticate, requireUser, IssueController.getMyIssues);
userRouter.get("/issues/:id", authenticate, requireUser, IssueController.getIssueById);

// Comment routes (users can view, create, update, and delete their own comments)
userRouter.post("/issues/:issueId/comments", authenticate, requireUser, CommentController.createUserComment);
userRouter.get("/issues/:issueId/comments", authenticate, requireUser, CommentController.getCommentsByIssue);
userRouter.put("/comments/:commentId", authenticate, requireUser, CommentController.updateUserComment);
userRouter.delete("/comments/:commentId", authenticate, requireUser, CommentController.deleteUserComment);

// Repost routes (protected - require user authentication)
userRouter.post("/issues/:issueId/repost", authenticate, requireUser, RepostController.repostIssue);
userRouter.delete("/issues/:issueId/repost", authenticate, requireUser, RepostController.unrepostIssue);
userRouter.get("/issues/:issueId/repost", authenticate, requireUser, RepostController.checkRepost);

export default userRouter;
