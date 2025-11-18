import express from "express";
import { AdminController } from "../controller/adminController.js";

const adminRouter = express.Router();

// Authentication routes
adminRouter.post("/auth/login", AdminController.login);

// Issue management routes
adminRouter.get("/issues", AdminController.getIssues);
adminRouter.get("/issues/:id", AdminController.getIssueById);
adminRouter.put("/issues/:id/status", AdminController.updateIssueStatus);

export default adminRouter;

