import express from "express";
import adminRouter from "./routes/admin.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();

// CORS configuration - Allow requests from emulators and mobile devices
app.use(cors({
  origin: '*', // Allow all origins for development (restrict in production)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for emulator access

app.listen(PORT, HOST, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    console.log("\n📱 Emulator Access URLs:");
    console.log("   - Android Emulator: http://10.0.2.2:3000");
    console.log("   - iOS Simulator: http://localhost:3000");
    console.log("   - Physical Device: http://<your-local-ip>:3000");
    console.log("\n💡 Tip: Use your machine's local IP for physical devices");
});



