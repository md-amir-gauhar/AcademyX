import { Router } from "express";
import { authenticatedRateLimiter } from "../middlewares/rate-limiter.middleware";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import clientAuthRoute from "./client-auth.route";
import otpAuthRoute from "./otp-auth.route";
import clientOrgConfigRoute from "./client-organization-config.route";
import batchRouter from "./client/batch.route";
import subjectRouter from "./client/subject.route";
import chapterRouter from "./client/chapter.route";
import topicRouter from "./client/topic.route";
import contentRouter from "./client/content.route";
import contentProgressRouter from "./client/content-progress.route";
import scheduleRouter from "./client/schedule.route";
import testSeriesRouter from "./client/test-series.route";
import testRouter from "./client/test.route";
import testAttemptRouter from "./test-series/test-attempt.route";
import userProfileRouter from "./client/user-profile.route";
import orderRouter from "./client/order.route";
import uploadRoute from "./upload.route";

const router = Router();

// Public routes (no authentication required)
router.use("/auth", clientAuthRoute);
router.use("/auth", otpAuthRoute); // OTP-based authentication
router.use("/organization-config", clientOrgConfigRoute);

const studentAuth = [
  authenticate,
  authorize("STUDENT"),
  authenticatedRateLimiter,
];

router.use("/batches", ...studentAuth, batchRouter);
router.use("/subjects", ...studentAuth, subjectRouter);
router.use("/chapters", ...studentAuth, chapterRouter);
router.use("/topics", ...studentAuth, topicRouter);
router.use("/contents", ...studentAuth, contentRouter);
router.use("/content", ...studentAuth, contentProgressRouter);
router.use("/schedules", ...studentAuth, scheduleRouter);
router.use("/test-series", ...studentAuth, testSeriesRouter);
router.use("/tests", ...studentAuth, testRouter);
router.use("/attempts", ...studentAuth, testAttemptRouter);
router.use("/profile", ...studentAuth, userProfileRouter);
router.use("/orders", ...studentAuth, orderRouter);
router.use("/upload", authenticatedRateLimiter, uploadRoute);

export default router;
