import { redis, isRedisAvailable } from "../config/redis";

/**
 * Cache key patterns for different entities
 */
export const CacheKeys = {
  // Batches
  BATCH_LIST: (orgId: string, page: number, limit: number) =>
    `batch:list:${orgId}:${page}:${limit}`,
  BATCH_BY_ID: (id: string) => `batch:${id}`,
  BATCH_BY_SLUG: (slug: string) => `batch:slug:${slug}`,
  BATCH_PURCHASED: (
    orgId: string,
    userId: string,
    page: number,
    limit: number
  ) => `batch:purchased:${orgId}:${userId}:${page}:${limit}`,

  // Subjects
  SUBJECT_LIST: (batchId: string) => `subject:list:batch:${batchId}`,
  SUBJECT_BY_ID: (id: string) => `subject:${id}`,

  // Chapters
  CHAPTER_LIST: (subjectId: string) => `chapter:list:subject:${subjectId}`,
  CHAPTER_BY_ID: (id: string) => `chapter:${id}`,

  // Topics
  TOPIC_LIST: (chapterId: string) => `topic:list:chapter:${chapterId}`,
  TOPIC_BY_ID: (id: string) => `topic:${id}`,

  // Contents
  CONTENT_LIST: (topicId: string) => `content:list:topic:${topicId}`,
  CONTENT_BY_ID: (id: string) => `content:${id}`,

  // Teachers
  TEACHER_LIST: (orgId: string) => `teacher:list:${orgId}`,
  TEACHER_BY_ID: (id: string) => `teacher:${id}`,
  TEACHER_BY_BATCH: (batchId: string) => `teacher:list:batch:${batchId}`,

  // Test Series
  TEST_SERIES_LIST: (page: number, limit: number) =>
    `testSeries:list:${page}:${limit}`,
  TEST_SERIES_BY_ID: (id: string) => `testSeries:${id}`,
  TEST_SERIES_BY_SLUG: (slug: string) => `testSeries:slug:${slug}`,
  TEST_SERIES_ENROLLED: (
    orgId: string,
    userId: string,
    page: number,
    limit: number
  ) => `testSeries:enrolled:${orgId}:${userId}:${page}:${limit}`,

  // Tests
  TEST_LIST_IN_SERIES: (seriesId: string) => `test:list:series:${seriesId}`,
  TEST_BY_ID: (id: string) => `test:${id}`,
  TEST_BY_SLUG: (slug: string) => `test:slug:${slug}`,
  TEST_DETAILS: (id: string) => `test:details:${id}`,

  // Sections
  SECTION_LIST_IN_TEST: (testId: string) => `section:list:test:${testId}`,
  SECTION_BY_ID: (id: string) => `section:${id}`,

  // Questions
  QUESTION_LIST_IN_SECTION: (sectionId: string) =>
    `question:list:section:${sectionId}`,
  QUESTION_BY_ID: (id: string) => `question:${id}`,
  QUESTION_OPTIONS: (questionId: string) =>
    `option:list:question:${questionId}`,

  // Schedules
  SCHEDULE_LIST: (topicId: string) => `schedule:list:topic:${topicId}`,
  SCHEDULE_BY_ID: (id: string) => `schedule:${id}`,
  SCHEDULE_BY_BATCH: (batchId: string) => `schedule:list:batch:${batchId}`,
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
  SHORT: 60 * 5, // 5 minutes - for frequently changing data
  MEDIUM: 60 * 15, // 15 minutes - for moderately stable data
  LONG: 60 * 60, // 1 hour - for stable data
  VERY_LONG: 60 * 60 * 24, // 24 hours - for rarely changing data
} as const;

/**
 * Cache manager class for handling Redis operations
 */
export class CacheManager {
  /**
   * Get cached data
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) return null;

    try {
      const data = await redis!.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  static async set(
    key: string,
    data: any,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<void> {
    if (!isRedisAvailable()) return;

    try {
      await redis!.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a single cache key
   */
  static async del(key: string): Promise<void> {
    if (!isRedisAvailable()) return;

    try {
      await redis!.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Invalidate cache by key or pattern (alias for del/delPattern)
   */
  static async invalidate(keyOrPattern: string): Promise<void> {
    // If it contains wildcards, use delPattern, otherwise use del
    if (keyOrPattern.includes("*")) {
      await this.delPattern(keyOrPattern);
    } else {
      await this.del(keyOrPattern);
    }
  }

  /**
   * Delete multiple cache keys matching a pattern
   */
  static async delPattern(pattern: string): Promise<void> {
    if (!isRedisAvailable()) return;

    try {
      const keys = await redis!.keys(pattern);
      if (keys.length > 0) {
        await redis!.del(...keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Invalidate all caches related to a batch
   */
  static async invalidateBatch(batchId: string, orgId?: string): Promise<void> {
    const patterns = [
      `batch:${batchId}*`,
      `batch:slug:*`, // Invalidate all slug-based lookups
      `subject:list:batch:${batchId}*`,
      `teacher:list:batch:${batchId}*`,
    ];

    if (orgId) {
      patterns.push(`batch:list:${orgId}:*`);
      patterns.push(`batch:purchased:${orgId}:*`);
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to a subject
   */
  static async invalidateSubject(
    subjectId: string,
    batchId?: string
  ): Promise<void> {
    const patterns = [
      `subject:${subjectId}*`,
      `chapter:list:subject:${subjectId}*`,
    ];

    if (batchId) {
      patterns.push(`subject:list:batch:${batchId}*`);
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to a chapter
   */
  static async invalidateChapter(
    chapterId: string,
    subjectId?: string
  ): Promise<void> {
    const patterns = [
      `chapter:${chapterId}*`,
      `topic:list:chapter:${chapterId}*`,
    ];

    if (subjectId) {
      patterns.push(`chapter:list:subject:${subjectId}*`);
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to a topic
   */
  static async invalidateTopic(
    topicId: string,
    chapterId?: string
  ): Promise<void> {
    const patterns = [
      `topic:${topicId}*`,
      `content:list:topic:${topicId}*`,
      `schedule:list:topic:${topicId}*`,
    ];

    if (chapterId) {
      patterns.push(`topic:list:chapter:${chapterId}*`);
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to content
   */
  static async invalidateContent(
    contentId: string,
    topicId?: string
  ): Promise<void> {
    const patterns = [`content:${contentId}*`];

    if (topicId) {
      patterns.push(`content:list:topic:${topicId}*`);
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to a teacher
   */
  static async invalidateTeacher(
    teacherId: string,
    orgId?: string
  ): Promise<void> {
    const patterns = [
      `teacher:${teacherId}*`,
      `teacher:list:batch:*`, // Teachers can be in multiple batches
    ];

    if (orgId) {
      patterns.push(`teacher:list:${orgId}*`);
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate teacher-batch relationship caches
   */
  static async invalidateTeacherBatch(
    teacherId: string,
    batchId: string
  ): Promise<void> {
    const patterns = [
      `teacher:${teacherId}*`,
      `teacher:list:batch:${batchId}*`,
      `batch:${batchId}*`, // Batch includes teachers array
    ];

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to a test series
   */
  static async invalidateTestSeries(
    testSeriesId?: string,
    orgId?: string
  ): Promise<void> {
    const patterns = [];

    if (testSeriesId) {
      patterns.push(`testSeries:${testSeriesId}*`);
      patterns.push(`testSeries:slug:*`); // Invalidate slug-based lookups
      patterns.push(`test:list:series:${testSeriesId}*`); // Tests in this series
    }

    if (orgId) {
      patterns.push(`testSeries:list:*`); // All test series lists
      patterns.push(`testSeries:enrolled:${orgId}:*`); // Enrolled test series
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to a test
   */
  static async invalidateTest(
    testId?: string,
    testSeriesId?: string,
    orgId?: string
  ): Promise<void> {
    const patterns = [];

    if (testId) {
      patterns.push(`test:${testId}*`);
      patterns.push(`test:client:${testId}*`); // Client route with userId
      patterns.push(`test:preview:${testId}*`); // Preview route with userId
      patterns.push(`test:slug:*`); // Invalidate slug-based lookups
      patterns.push(`test:client:slug:*`); // Client slug-based lookups with userId
      patterns.push(`section:list:test:${testId}*`); // Sections in this test
      patterns.push(`test:details:${testId}*`); // Full test details
    }

    if (testSeriesId) {
      patterns.push(`test:list:series:${testSeriesId}*`); // Tests in series
      patterns.push(`testSeries:${testSeriesId}*`); // Parent series
    }

    if (orgId) {
      patterns.push(`test:list:*`); // All test lists
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to a test section
   */
  static async invalidateSection(
    sectionId?: string,
    testId?: string
  ): Promise<void> {
    const patterns = [];

    if (sectionId) {
      patterns.push(`section:${sectionId}*`);
      patterns.push(`question:list:section:${sectionId}*`); // Questions in this section
    }

    if (testId) {
      patterns.push(`section:list:test:${testId}*`); // Sections in test
      patterns.push(`test:${testId}*`); // Parent test
      patterns.push(`test:details:${testId}*`); // Full test details
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to a question
   */
  static async invalidateQuestion(
    questionId?: string,
    sectionId?: string,
    testId?: string
  ): Promise<void> {
    const patterns = [];

    if (questionId) {
      patterns.push(`question:${questionId}*`);
      patterns.push(`option:list:question:${questionId}*`); // Options for this question
    }

    if (sectionId) {
      patterns.push(`question:list:section:${sectionId}*`); // Questions in section
      patterns.push(`section:${sectionId}*`); // Parent section
    }

    if (testId) {
      patterns.push(`test:${testId}*`); // Parent test
      patterns.push(`test:details:${testId}*`); // Full test details
    }

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Invalidate all caches related to a schedule
   */
  static async invalidateSchedule(
    scheduleId: string,
    topicId?: string
  ): Promise<void> {
    const patterns = [`schedule:${scheduleId}*`];

    if (topicId) {
      patterns.push(`schedule:list:topic:${topicId}*`);
    }

    // Also invalidate batch-level schedule caches if needed
    patterns.push(`schedule:list:batch:*`);

    await Promise.all(patterns.map((pattern) => this.delPattern(pattern)));
  }

  /**
   * Clear all caches for a specific organization
   */
  static async clearOrganizationCache(organizationId: string): Promise<number> {
    if (!isRedisAvailable()) return 0;

    try {
      // Get all keys in Redis
      const allKeys = await redis!.keys("*");

      // Filter keys that belong to this organization
      const orgKeys = allKeys.filter((key) => key.includes(organizationId));

      let totalCleared = 0;

      if (orgKeys.length > 0) {
        // Delete all matching keys
        await redis!.del(...orgKeys);
        totalCleared = orgKeys.length;
      }

      console.log(
        `✅ Cleared ${totalCleared} cache keys for organization ${organizationId}`
      );
      return totalCleared;
    } catch (error) {
      console.error(
        `Cache clear error for organization ${organizationId}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Clear all caches (use with caution)
   */
  static async flush(): Promise<void> {
    if (!isRedisAvailable()) return;

    try {
      await redis!.flushdb();
      console.log("✅ All caches cleared");
    } catch (error) {
      console.error("Cache flush error:", error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    isAvailable: boolean;
    keyCount?: number;
    memoryUsed?: string;
  }> {
    if (!isRedisAvailable()) {
      return { isAvailable: false };
    }

    try {
      const dbSize = await redis!.dbsize();
      const info = await redis!.info("memory");
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1].trim() : "Unknown";

      return {
        isAvailable: true,
        keyCount: dbSize,
        memoryUsed,
      };
    } catch (error) {
      console.error("Cache stats error:", error);
      return { isAvailable: true };
    }
  }
}
