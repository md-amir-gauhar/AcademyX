import { Router } from "express";
import { authenticatedRateLimiter } from "../middlewares/rate-limiter.middleware";

import authRoute from "./auth.route";
import organizationRoute from "./organization.route";
import organizationConfigRoute from "./organization-config.route";
import userRoute from "./user.route";
import uploadRoute from "./upload.route";
import cacheRoute from "./cache.route";
import batchRoute from "./admin/batch.route";
import teacherRoute from "./admin/teacher.route";
import subjectRoute from "./admin/subject.route";
import chapterRoute from "./admin/chapter.route";
import topicRoute from "./admin/topic.route";
import contentRoute from "./admin/content.route";
import scheduleRoute from "./admin/schedule.route";
import testSeriesRoute from "./admin/test-series.route";
import testRoute from "./admin/test.route";
import mediaRoute from "./admin/media.route";

const router = Router();

router.use("/organizations", organizationRoute);
router.use(
  "/organization-config",
  authenticatedRateLimiter,
  organizationConfigRoute
);
router.use("/auth", authRoute);
router.use("/users", authenticatedRateLimiter, userRoute);
router.use("/upload", authenticatedRateLimiter, uploadRoute);
router.use("/cache", authenticatedRateLimiter, cacheRoute);
router.use("/batches", authenticatedRateLimiter, batchRoute);
router.use("/teachers", authenticatedRateLimiter, teacherRoute);
router.use("/subjects", authenticatedRateLimiter, subjectRoute);
router.use("/chapters", authenticatedRateLimiter, chapterRoute);
router.use("/topics", authenticatedRateLimiter, topicRoute);
router.use("/contents", authenticatedRateLimiter, contentRoute);
router.use("/schedules", authenticatedRateLimiter, scheduleRoute);
router.use("/test-series", authenticatedRateLimiter, testSeriesRoute);
router.use("/tests", authenticatedRateLimiter, testRoute);
router.use("/media", authenticatedRateLimiter, mediaRoute);

export default router;
