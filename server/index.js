const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const rateLimit = require("express-rate-limit");
const fileRoutes = require("./routes/fileRoutes");
const shareRoutes = require("./routes/shareRoutes");
const initCronJobs = require("./services/cronService");

// 100 requests per 5 minutes
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: { message: "Too many attempts, please try again after 5 minutes" },
});

// General limiter for files — 200 requests per 15 mins
const filesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests, please slow down" },
});

// General limiter for shares — 100 requests per 15 mins
const sharesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please slow down" },
});

require("dotenv").config();

const app = express();

// Section 8: Security Middlewares
app.use(helmet());
const allowedOrigins = [
  "http://localhost:5173", // Your current Vite dev server
  "https://cloud-verse.vercel.app",
  "https://cloud-clone.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
// Apply only to auth routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/files", filesLimiter, fileRoutes);
app.use("/api/shares", sharesLimiter, shareRoutes);

// Start the automated tasks
initCronJobs();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
