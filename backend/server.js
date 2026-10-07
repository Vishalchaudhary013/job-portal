import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import { getRedisClient, isRedisConfigured } from "./config/redis.js";
import internshipRoutes from "./routers/internshipRoutes.js";
import globalProgramRoutes from "./routers/globalProgramRoutes.js";
import applicationRoutes from "./routers/applicationRoutes.js";
import authRoutes from "./routers/authRoutes.js";
import studentProfileRoutes from "./routers/studentProfileRoutes.js";
import academicRecordRoutes from "./routers/academicRecordRoutes.js";
import formRoutes from "./formBuilder/routes/formRoutes.js";
import templateRoutes from "./formBuilder/routes/templateRoutes.js";
import submissionRoutes from "./formBuilder/routes/submissionRoutes.js";
import customCategoryRoutes from "./routers/customCategoryRoutes.js";
import errorHandler from "./middleware/errorMiddleware.js";

// Career Services portal backend — a trimmed copy of the Edeco backend/.
// Controllers, models, middleware and services are verbatim copies; only this
// file is portal-specific. It connects to the SAME MongoDB (MONGO_URI) as the
// main Edeco backend, so admins, users, jobs and applications are shared.
//
// Not started here on purpose (the main Edeco backend already runs them against
// the same database — running them twice would double-send): cron jobs /
// notifiers from utils/startup.js, WhatsApp provider boot, default form
// template seeding.
const app = express();

dotenv.config();

const port = process.env.PORT || 3001;
connectDB();
getRedisClient(); // starts connecting at boot so /health reflects real status quickly

app.set("trust proxy", 1);

// exposedHeaders: the dashboard reads the Excel download name and the Google
// Sheets sync result from these response headers.
app.use(
  cors({
    exposedHeaders: [
      "Content-Disposition",
      "X-Google-Sheet-Status",
      "X-Google-Sheet-Url",
      "X-Google-Sheet-Error",
      "X-Stakeholder-Count",
    ],
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Uploads made through this portal are written to ./uploads. The database is
// shared with Edeco, so records can also point at files uploaded through the
// main site — fall back to Edeco's backend/uploads for those.
const EDECO_UPLOADS_DIR =
  process.env.EDECO_UPLOADS_DIR || path.join(process.cwd(), "..", "..", "backend", "uploads");
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/uploads", express.static(EDECO_UPLOADS_DIR));

app.get("/health", async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;

  let redisOk = false;
  try {
    if (isRedisConfigured()) {
      redisOk = (await getRedisClient().ping()) === "PONG";
    }
  } catch (error) {
    redisOk = false;
  }

  const healthy = mongoOk && redisOk;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    service: "career-services-backend",
    pid: process.pid,
    port,
    uptimeSeconds: Math.round(process.uptime()),
    dependencies: {
      mongo: mongoOk ? "up" : "down",
      redis: redisOk ? "up" : "down",
    },
  });
});

// Internships, Jobs and Apprenticeships all live in the internships collection.
// Global programs are mounted because the shared OpportunitiesContext loads them
// together with internships on boot.
app.use("/api/internships", internshipRoutes);
app.use("/api/global-programs", globalProgramRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/student-profile", studentProfileRoutes);
app.use("/api/student-profile/academic-records", academicRecordRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/custom-categories", customCategoryRoutes);

// The copied OpportunitiesContext also lists master classes and bootcamps on
// boot. Those sections aren't part of this portal, so answer with empty lists
// instead of 404s.
app.get("/api/masterclasses", (req, res) => res.json([]));
app.get("/api/bootcamps", (req, res) => res.json([]));

app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Career Services backend listening on port : ${port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      // best-effort — the process is exiting either way
    }
    const redis = getRedisClient();
    if (redis) redis.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
