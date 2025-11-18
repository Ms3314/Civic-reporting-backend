import express from "express";
import adminRouter from "./routes/admin.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Hack Backend API Documentation",
}));

// Serve OpenAPI spec as JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/user", userRouter);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
    console.log("Swagger UI available at http://localhost:3000/api-docs");
});



