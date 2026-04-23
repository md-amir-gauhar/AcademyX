import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import adminRoutes from "./routes/admin.route";
import clientRoutes from "./routes/client.route";
import healthRoutes from "./routes/health.route";
import { Request, Response, NextFunction } from "express";
import { swaggerSpec } from "./config/swagger";

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

// Security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);

    // Explicit whitelist of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "https://www.queztlearn.com",
      "https://queztlearn.com",
    ].filter(Boolean);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      (origin.startsWith("https://") && origin.endsWith(".queztlearn.com")) ||
      origin.startsWith("http://localhost:") ||
      origin.match(/^http:\/\/[\w-]+\.localhost:\d+$/) || // Support *.localhost:port subdomains
      origin.startsWith("http://127.0.0.1:");

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/health-check", healthRoutes);
app.use("/admin", adminRoutes);
app.use("/api", clientRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  console.error("Error:", err);

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err.error : undefined,
  });
});

app
  .listen(port, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Health check available at: /health-check`);
  })
  .on("error", (err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
