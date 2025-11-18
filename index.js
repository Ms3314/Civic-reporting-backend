import express from "express";
import adminRouter from "./routes/admin.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.js";

const app = express();

// so this will be a basic 

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/user", userRouter);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});



