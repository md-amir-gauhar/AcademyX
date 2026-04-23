import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "TEACHER",
  "GUEST",
  "STUDENT",
]);

export const classEnum = pgEnum("class", ["11", "12", "12+", "Grad"]);

export const examEnum = pgEnum("exam", [
  "JEE",
  "NEET",
  "UPSC",
  "BANK",
  "SSC",
  "GATE",
  "CAT",
  "NDA",
  "CLAT",
  "OTHER",
]);

export const contentTypeEnum = pgEnum("content_type", ["Lecture", "PDF"]);

export const videoTypeEnum = pgEnum("video_type", ["HLS", "YOUTUBE"]);

export const entityTypeEnum = pgEnum("entity_type", ["BATCH", "TEST_SERIES"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "RAZORPAY",
  "STRIPE",
  "PAYPAL",
  "FREE",
]);

export const statusEnum = pgEnum("status", ["ACTIVE", "INACTIVE"]);

export const scheduleStatusEnum = pgEnum("schedule_status", [
  "SCHEDULED",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const organization = table("organization", {
  id: t.uuid().defaultRandom().primaryKey(),
  name: t.varchar({ length: 255 }).notNull().unique(),
  slug: t.varchar({ length: 255 }).notNull().unique(),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
});

export const organizationConfig = table("organization_config", {
  id: t.uuid().defaultRandom().primaryKey(),
  organizationId: t
    .uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" })
    .unique(),

  // Core info
  name: t.varchar({ length: 255 }),
  slug: t.varchar({ length: 255 }).unique(),
  domain: t.varchar({ length: 255 }),
  contactEmail: t.varchar("contact_email", { length: 255 }),
  contactPhone: t.varchar("contact_phone", { length: 20 }),

  // Payment (SENSITIVE - Admin only)
  razorpayKeyId: t.varchar("razorpay_key_id", { length: 255 }),
  razorpayKeySecret: t.varchar("razorpay_key_secret", { length: 255 }),
  currency: t.varchar({ length: 10 }).default("INR"),
  taxPercentage: t.varchar("tax_percentage", { length: 10 }),
  invoicePrefix: t.varchar("invoice_prefix", { length: 20 }),

  // Branding
  logoUrl: t.text("logo_url"),
  faviconUrl: t.text("favicon_url"),
  bannerUrls: t.jsonb("banner_urls").$type<string[]>(),
  motto: t.varchar({ length: 255 }),
  description: t.text(),
  theme: t.jsonb().$type<{
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  }>(),

  // Landing page content
  heroTitle: t.varchar("hero_title", { length: 255 }),
  heroSubtitle: t.text("hero_subtitle"),
  ctaText: t.varchar("cta_text", { length: 255 }),
  ctaUrl: t.text("cta_url"),
  features: t
    .jsonb()
    .$type<{ title: string; description: string; icon?: string }[]>(),
  testimonials: t
    .jsonb()
    .$type<{ name: string; message: string; avatar?: string }[]>(),
  faq: t.jsonb().$type<{ question: string; answer: string }[]>(),
  socialLinks: t.jsonb("social_links").$type<Record<string, string>>(),

  // SEO
  metaTitle: t.varchar("meta_title", { length: 255 }),
  metaDescription: t.text("meta_description"),
  ogImage: t.text("og_image"),

  // Communication (SENSITIVE - Admin only)
  smtpConfig: t.jsonb("smtp_config").$type<{
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }>(),
  supportEmail: t.varchar("support_email", { length: 255 }),

  // Feature toggles
  featuresEnabled: t.jsonb("features_enabled").$type<Record<string, boolean>>(),
  maintenanceMode: t.boolean("maintenance_mode").default(false),
  customCSS: t.text("custom_css"),
  customJS: t.text("custom_js"),

  // Organization status control (SUPER ADMIN only)
  isActive: t.boolean("is_active").default(true),
  disabledReason: t.text("disabled_reason"),
  disabledAt: t.timestamp("disabled_at"),
  reactivatedAt: t.timestamp("reactivated_at"),

  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
});

export const user = table(
  "user",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id),
    email: t.varchar({ length: 255 }),
    username: t.varchar({ length: 255 }),
    password: t.varchar({ length: 255 }),
    role: userRoleEnum().notNull().default("ADMIN"),
    isVerified: t.boolean("is_verified").notNull().default(false),
    profileImg: t.text("profile_img"),
    gender: t.varchar({ length: 20 }),
    countryCode: t.varchar("country_code", { length: 10 }),
    phoneNumber: t.varchar("phone_number", { length: 20 }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  // Per-organization uniqueness for email/phone so the same identifier can
  // exist across different tenants. Postgres treats NULLs as distinct in
  // unique indexes, so users without an email (OTP-only signup) or without a
  // phone (admin email signup) won't conflict.
  (table) => [
    t
      .uniqueIndex("user_org_email_unique")
      .on(table.organizationId, table.email),
    t
      .uniqueIndex("user_org_phone_unique")
      .on(table.organizationId, table.phoneNumber),
  ]
);

export const address = table("address", {
  id: t.uuid().defaultRandom().primaryKey(),
  userId: t
    .uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  city: t.varchar({ length: 255 }),
  state: t.varchar({ length: 255 }),
  pincode: t.varchar({ length: 10 }),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
});

export const verificationToken = table("verification_token", {
  id: t.uuid().defaultRandom().primaryKey(),
  userId: t
    .uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: t.varchar({ length: 500 }).notNull().unique(),
  expiresAt: t.timestamp("expires_at").notNull(),
  isUsed: t.boolean("is_used").notNull().default(false),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
});

// Unified Orders Table for Batches and Test Series
export const orders = table(
  "orders",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Polymorphic reference to either batch or test_series
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: t.uuid("entity_id").notNull(), // References batches.id or testSeries.id

    // Payment details
    amount: t.real().notNull(),
    currency: t.varchar({ length: 10 }).notNull().default("INR"),
    paymentProvider: paymentProviderEnum("payment_provider")
      .notNull()
      .default("RAZORPAY"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("PENDING"),

    // Gateway integration (Razorpay, Stripe, etc.)
    providerOrderId: t.varchar("provider_order_id", { length: 255 }),
    providerPaymentId: t.varchar("provider_payment_id", { length: 255 }),
    providerSignature: t.varchar("provider_signature", { length: 500 }),

    // Transaction metadata
    receiptId: t.varchar("receipt_id", { length: 255 }),
    transactionData: t.jsonb("transaction_data"), // Store full gateway response
    failureReason: t.text("failure_reason"),

    // Refund details
    refundId: t.varchar("refund_id", { length: 255 }),
    refundAmount: t.real("refund_amount"),
    refundedAt: t.timestamp("refunded_at"),

    // Timestamps
    initiatedAt: t.timestamp("initiated_at").defaultNow().notNull(),
    completedAt: t.timestamp("completed_at"),
    failedAt: t.timestamp("failed_at"),

    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("orders_user_idx").on(table.userId),
    t.index("orders_entity_idx").on(table.entityType, table.entityId),
    t.index("orders_status_idx").on(table.paymentStatus),
    t.index("orders_provider_order_idx").on(table.providerOrderId),
  ]
);

export const batches = table(
  "batches",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    slug: t.varchar({ length: 255 }).notNull().unique(),
    name: t.varchar({ length: 255 }).notNull(),
    description: t.jsonb(), // Rich text/HTML content
    class: classEnum().notNull(),
    exam: examEnum().notNull(),
    imageUrl: t.varchar("image_url", { length: 500 }),
    startDate: t.timestamp("start_date").notNull(),
    endDate: t.timestamp("end_date").notNull(),
    language: t.text().notNull().default("English"),
    totalPrice: t.real("total_price").notNull(),
    discountPercentage: t.real("discount_percentage").notNull().default(0),
    faq: t.jsonb(), // Array of {title: string, description: string}
    status: statusEnum().notNull().default("ACTIVE"),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("batches_slug_idx").on(table.slug),
    t.index("batches_organization_idx").on(table.organizationId),
    t.index("batches_exam_idx").on(table.exam),
  ]
);

export const userBatchMapping = table(
  "user_batch_mapping",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    batchId: t
      .uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Pricing captured at enrollment
    originalPrice: t.real("original_price").notNull(),
    discountAmount: t.real("discount_amount").notNull().default(0),
    finalPrice: t.real("final_price").notNull(),

    // Order reference (null for free enrollments)
    orderId: t.uuid("order_id").references(() => orders.id),

    // Access period
    startDate: t.timestamp("start_date").defaultNow().notNull(),
    expiresAt: t.timestamp("expires_at"),
    isActive: t.boolean("is_active").notNull().default(true),

    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("user_batch_idx").on(table.userId, table.batchId),
    t.index("user_org_batch_idx").on(table.userId, table.organizationId),
    t.uniqueIndex("unique_user_batch").on(table.userId, table.batchId),
  ]
);

export const teachers = table(
  "teachers",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: t.varchar({ length: 255 }).notNull(),
    highlights: t.jsonb(), // HTML content
    imageUrl: t.varchar("image_url", { length: 500 }),
    subjects: t.jsonb(), // Array of strings
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [t.index("teachers_organization_idx").on(table.organizationId)]
);

export const batchTeacherMapping = table(
  "batch_teacher_mapping",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    batchId: t
      .uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    teacherId: t
      .uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("batch_teacher_batch_idx").on(table.batchId),
    t.index("batch_teacher_teacher_idx").on(table.teacherId),
    t.index("batch_teacher_org_idx").on(table.organizationId),
  ]
);

export const subjects = table(
  "subjects",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    name: t.text().notNull(),
    batchId: t
      .uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    thumbnailUrl: t.varchar("thumbnail_url", { length: 500 }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [t.index("subjects_batch_idx").on(table.batchId)]
);

export const teacherSubjectMapping = table(
  "teacher_subject_mapping",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    teacherId: t
      .uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    subjectId: t
      .uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("teacher_subject_teacher_idx").on(table.teacherId),
    t.index("teacher_subject_subject_idx").on(table.subjectId),
  ]
);

export const chapters = table(
  "chapters",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    name: t.text().notNull(),
    subjectId: t
      .uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    lectureCount: t.integer("lecture_count").notNull().default(0),
    lectureDuration: t.varchar("lecture_duration", { length: 50 }), // e.g. "10+ hr"
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [t.index("chapters_subject_idx").on(table.subjectId)]
);

export const topics = table(
  "topics",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    name: t.text().notNull(),
    chapterId: t
      .uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [t.index("topics_chapter_idx").on(table.chapterId)]
);

export const contents = table(
  "contents",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    name: t.text().notNull(),
    type: contentTypeEnum().notNull(),
    pdfUrl: t.varchar("pdf_url", { length: 500 }),
    videoUrl: t.varchar("video_url", { length: 500 }),
    videoType: videoTypeEnum("video_type"),
    videoThumbnail: t.varchar("video_thumbnail", { length: 500 }),
    videoDuration: t.real("video_duration"), // in seconds/minutes
    isCompleted: t.boolean("is_completed").notNull().default(false),
    topicId: t
      .uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [t.index("contents_topic_idx").on(table.topicId)]
);

export const schedules = table(
  "schedules",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    topicId: t
      .uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    batchId: t
      .uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    subjectId: t
      .uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),

    // Content details
    title: t.varchar({ length: 255 }).notNull(),
    description: t.text(),
    subjectName: t.varchar("subject_name", { length: 255 }).notNull(),

    // Live class info
    youtubeLink: t.varchar("youtube_link", { length: 500 }).notNull(),
    scheduledAt: t.timestamp("scheduled_at").notNull(),
    duration: t.integer().notNull(), // in minutes

    // Status lifecycle
    status: scheduleStatusEnum().notNull().default("SCHEDULED"),

    // Optional metadata
    teacherId: t
      .uuid("teacher_id")
      .references(() => teachers.id, { onDelete: "set null" }),
    thumbnailUrl: t.varchar("thumbnail_url", { length: 500 }),

    // Additional fields
    notifyBeforeMinutes: t.integer("notify_before_minutes").default(30),
    tags: t.jsonb().$type<string[]>(), // Array of strings
    reminderSent: t.boolean("reminder_sent").notNull().default(false),

    // Post-completion
    contentId: t
      .uuid("content_id")
      .references(() => contents.id, { onDelete: "set null" }),

    // Timestamps
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("schedules_organization_idx").on(table.organizationId),
    t.index("schedules_topic_idx").on(table.topicId),
    t.index("schedules_batch_idx").on(table.batchId),
    t.index("schedules_subject_idx").on(table.subjectId),
    t.index("schedules_scheduled_at_idx").on(table.scheduledAt),
    t.index("schedules_status_idx").on(table.status),
    t.index("schedules_teacher_idx").on(table.teacherId),
  ]
);

// User Content Progress - Video Watch Tracking
export const userContentProgress = table(
  "user_content_progress",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contentId: t
      .uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    batchId: t
      .uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),

    // Progress tracking
    watchedSeconds: t.integer("watched_seconds").notNull().default(0),
    totalDuration: t.integer("total_duration").notNull(), // Snapshot of video duration at time of tracking
    watchPercentage: t.real("watch_percentage").notNull().default(0),

    // Completion tracking
    isCompleted: t.boolean("is_completed").notNull().default(false),
    completedAt: t.timestamp("completed_at"),

    // Engagement metrics
    watchCount: t.integer("watch_count").notNull().default(1), // Number of times user watched
    lastWatchedAt: t.timestamp("last_watched_at").notNull().defaultNow(),

    // Timestamps
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t
      .index("user_content_progress_user_last_watched_idx")
      .on(table.userId, table.lastWatchedAt),
    t
      .uniqueIndex("user_content_progress_user_content_idx")
      .on(table.userId, table.contentId),
    t.index("user_content_progress_batch_idx").on(table.userId, table.batchId),
    t
      .index("user_content_progress_completed_idx")
      .on(table.userId, table.isCompleted),
  ]
);

// Relations

export const batchTeacherMappingRelations = relations(
  batchTeacherMapping,
  ({ one }) => ({
    batch: one(batches, {
      fields: [batchTeacherMapping.batchId],
      references: [batches.id],
    }),
    teacher: one(teachers, {
      fields: [batchTeacherMapping.teacherId],
      references: [teachers.id],
    }),
    organization: one(organization, {
      fields: [batchTeacherMapping.organizationId],
      references: [organization.id],
    }),
  })
);

export const organizationRelations = relations(
  organization,
  ({ one, many }) => ({
    config: one(organizationConfig, {
      fields: [organization.id],
      references: [organizationConfig.organizationId],
    }),
    users: many(user),
    batches: many(batches),
    testSeries: many(testSeries),
  })
);

export const organizationConfigRelations = relations(
  organizationConfig,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationConfig.organizationId],
      references: [organization.id],
    }),
  })
);

export const userRelations = relations(user, ({ many, one }) => ({
  organization: one(organization, {
    fields: [user.organizationId],
    references: [organization.id],
  }),
  verificationTokens: many(verificationToken),
  batchEnrollments: many(userBatchMapping),
  testSeriesEnrollments: many(userTestSeriesMapping),
  testAttempts: many(testAttempts),
  payments: many(orders),
  contentProgress: many(userContentProgress),
  address: one(address, {
    fields: [user.id],
    references: [address.userId],
  }),
}));

export const addressRelations = relations(address, ({ one }) => ({
  user: one(user, {
    fields: [address.userId],
    references: [user.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [orders.organizationId],
    references: [organization.id],
  }),
  // Note: entityId can reference either batches.id or testSeries.id based on entityType
  // Drizzle doesn't support polymorphic relations directly, so handle in application logic
}));

export const batchesRelations = relations(batches, ({ many, one }) => ({
  organization: one(organization, {
    fields: [batches.organizationId],
    references: [organization.id],
  }),
  teacherMappings: many(batchTeacherMapping),
  subjects: many(subjects),
  enrollments: many(userBatchMapping),
}));

export const userBatchMappingRelations = relations(
  userBatchMapping,
  ({ one }) => ({
    user: one(user, {
      fields: [userBatchMapping.userId],
      references: [user.id],
    }),
    batch: one(batches, {
      fields: [userBatchMapping.batchId],
      references: [batches.id],
    }),
    organization: one(organization, {
      fields: [userBatchMapping.organizationId],
      references: [organization.id],
    }),
    order: one(orders, {
      fields: [userBatchMapping.orderId],
      references: [orders.id],
    }),
  })
);

export const teachersRelations = relations(teachers, ({ many }) => ({
  batchMappings: many(batchTeacherMapping),
  subjectMappings: many(teacherSubjectMapping),
}));

export const teacherSubjectMappingRelations = relations(
  teacherSubjectMapping,
  ({ one }) => ({
    teacher: one(teachers, {
      fields: [teacherSubjectMapping.teacherId],
      references: [teachers.id],
    }),
    subject: one(subjects, {
      fields: [teacherSubjectMapping.subjectId],
      references: [subjects.id],
    }),
  })
);

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  batch: one(batches, {
    fields: [subjects.batchId],
    references: [batches.id],
  }),
  teacherMappings: many(teacherSubjectMapping),
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [chapters.subjectId],
    references: [subjects.id],
  }),
  topics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [topics.chapterId],
    references: [chapters.id],
  }),
  contents: many(contents),
}));

export const contentsRelations = relations(contents, ({ one, many }) => ({
  topic: one(topics, {
    fields: [contents.topicId],
    references: [topics.id],
  }),
  userProgress: many(userContentProgress),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  organization: one(organization, {
    fields: [schedules.organizationId],
    references: [organization.id],
  }),
  topic: one(topics, {
    fields: [schedules.topicId],
    references: [topics.id],
  }),
  batch: one(batches, {
    fields: [schedules.batchId],
    references: [batches.id],
  }),
  subject: one(subjects, {
    fields: [schedules.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [schedules.teacherId],
    references: [teachers.id],
  }),
  content: one(contents, {
    fields: [schedules.contentId],
    references: [contents.id],
  }),
}));

export const userContentProgressRelations = relations(
  userContentProgress,
  ({ one }) => ({
    user: one(user, {
      fields: [userContentProgress.userId],
      references: [user.id],
    }),
    content: one(contents, {
      fields: [userContentProgress.contentId],
      references: [contents.id],
    }),
    organization: one(organization, {
      fields: [userContentProgress.organizationId],
      references: [organization.id],
    }),
    batch: one(batches, {
      fields: [userContentProgress.batchId],
      references: [batches.id],
    }),
  })
);

// ==================== TEST PLATFORM ====================

// Enums for test platform
export const questionTypeEnum = pgEnum("question_type", [
  "MCQ",
  "TRUE_FALSE",
  "FILL_BLANK",
  "NUMERICAL",
]);

export const difficultyEnum = pgEnum("difficulty", ["EASY", "MEDIUM", "HARD"]);

// Test Series (Collection of tests for a specific exam)
export const testSeries = table(
  "test_series",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    exam: examEnum().notNull(),
    title: t.varchar({ length: 255 }).notNull(),
    description: t.jsonb(), // Rich text/HTML content
    slug: t.varchar({ length: 255 }).notNull().unique(),
    imageUrl: t.varchar("image_url", { length: 500 }),
    faq: t.jsonb(), // Array of {title: string, description: string}

    totalPrice: t.real("total_price").notNull().default(0),
    discountPercentage: t.real("discount_percentage").notNull().default(0),
    isFree: t.boolean("is_free").notNull().default(false),
    durationDays: t.integer("duration_days").default(365), // Access validity in days
    testCount: t.integer("test_count").notNull().default(0),
    totalQuestions: t.integer("total_questions").default(0),
    isPurchased: t.boolean("is_purchased").default(false),
    isPublished: t.boolean("is_published").notNull().default(false),
    status: statusEnum().notNull().default("ACTIVE"),
    publishedAt: t.timestamp("published_at"),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("test_series_slug_idx").on(table.slug),
    t.index("test_series_org_idx").on(table.organizationId),
    t.index("test_series_exam_idx").on(table.exam),
  ]
);

// Individual Tests within a Test Series
export const tests = table(
  "tests",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    testSeriesId: t
      .uuid("test_series_id")
      .notNull()
      .references(() => testSeries.id, { onDelete: "cascade" }),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    title: t.varchar({ length: 255 }).notNull(),
    description: t.jsonb(),
    slug: t.varchar({ length: 255 }).notNull().unique(),
    instructions: t.jsonb(),

    // Test configuration
    durationMinutes: t.integer("duration_minutes").notNull(),
    totalMarks: t.integer("total_marks").notNull().default(100),
    passingMarks: t.integer("passing_marks").default(40),

    // Access control
    isFree: t.boolean("is_free").notNull().default(false),
    isPublished: t.boolean("is_published").notNull().default(false),

    // Test settings
    showAnswersAfterSubmit: t
      .boolean("show_answers_after_submit")
      .notNull()
      .default(true),
    allowReview: t.boolean("allow_review").notNull().default(true),
    shuffleQuestions: t.boolean("shuffle_questions").notNull().default(false),

    // Metadata
    sectionCount: t.integer("section_count").default(0),
    questionCount: t.integer("question_count").default(0),
    attemptCount: t.integer("attempt_count").default(0),

    publishedAt: t.timestamp("published_at"),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("tests_slug_idx").on(table.slug),
    t.index("tests_series_idx").on(table.testSeriesId),
    t.index("tests_org_idx").on(table.organizationId),
  ]
);

// Sections within a Test (e.g., Physics, Chemistry, Maths)
export const testSections = table(
  "test_sections",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    testId: t
      .uuid("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),

    name: t.varchar({ length: 255 }).notNull(), // e.g., "Physics", "Chemistry"
    description: t.text(),
    displayOrder: t.integer("display_order").notNull().default(0),

    // Section settings
    totalMarks: t.integer("total_marks").default(0),
    questionCount: t.integer("question_count").default(0),

    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("test_sections_test_idx").on(table.testId),
    t.index("test_sections_order_idx").on(table.testId, table.displayOrder),
  ]
);

// Questions in Test Sections
export const testQuestions = table(
  "test_questions",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    sectionId: t
      .uuid("section_id")
      .notNull()
      .references(() => testSections.id, { onDelete: "cascade" }),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Question content
    text: t.text().notNull(),
    imageUrl: t.varchar("image_url", { length: 500 }),

    // Question type and difficulty
    type: questionTypeEnum().notNull().default("MCQ"),
    difficulty: difficultyEnum().notNull().default("MEDIUM"),

    // Marking scheme
    marks: t.integer().notNull().default(1),
    negativeMarks: t.real("negative_marks").default(0),

    // Answer explanation
    explanation: t.text(),
    explanationImageUrl: t.varchar("explanation_image_url", { length: 500 }),

    // Display settings
    displayOrder: t.integer("display_order").notNull().default(0),

    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("test_questions_section_idx").on(table.sectionId),
    t.index("test_questions_org_idx").on(table.organizationId),
    t.index("test_questions_order_idx").on(table.sectionId, table.displayOrder),
  ]
);

// Answer Options for MCQ Questions
export const testQuestionOptions = table(
  "test_question_options",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    questionId: t
      .uuid("question_id")
      .notNull()
      .references(() => testQuestions.id, { onDelete: "cascade" }),

    text: t.text().notNull(),
    imageUrl: t.varchar("image_url", { length: 500 }),
    displayOrder: t.integer("display_order").notNull().default(0),
    isCorrect: t.boolean("is_correct").notNull().default(false),

    createdAt: t.timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("test_question_options_question_idx").on(table.questionId),
  ]
);

// User enrollment in Test Series
export const userTestSeriesMapping = table(
  "user_test_series_mapping",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    testSeriesId: t
      .uuid("test_series_id")
      .notNull()
      .references(() => testSeries.id, { onDelete: "cascade" }),
    organizationId: t
      .uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Pricing at enrollment time
    originalPrice: t.real("original_price").notNull(),
    discountAmount: t.real("discount_amount").default(0),
    finalPrice: t.real("final_price").notNull(),

    // Access period
    startDate: t.timestamp("start_date").defaultNow().notNull(),
    endDate: t.timestamp("end_date").notNull(),

    // Status
    isActive: t.boolean("is_active").notNull().default(true),

    // Order reference (null for free enrollments)
    orderId: t.uuid("order_id").references(() => orders.id),

    enrolledAt: t.timestamp("enrolled_at").defaultNow().notNull(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("user_test_series_user_idx").on(table.userId),
    t.index("user_test_series_series_idx").on(table.testSeriesId),
    t
      .uniqueIndex("unique_user_test_series")
      .on(table.userId, table.testSeriesId),
  ]
);

// Test Attempts by Users
export const testAttempts = table(
  "test_attempts",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    testId: t
      .uuid("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),

    // Attempt tracking
    attemptNumber: t.integer("attempt_number").notNull().default(1),

    // Timestamps
    startedAt: t.timestamp("started_at").defaultNow().notNull(),
    submittedAt: t.timestamp("submitted_at"),

    // Time tracking
    timeSpentSeconds: t.integer("time_spent_seconds").default(0),

    // Scoring
    totalScore: t.real("total_score").default(0),
    percentage: t.real().default(0),

    correctCount: t.integer("correct_count").default(0),
    wrongCount: t.integer("wrong_count").default(0),
    skippedCount: t.integer("skipped_count").default(0),

    // Status
    isCompleted: t.boolean("is_completed").notNull().default(false),
    isPassed: t.boolean("is_passed"),

    // Ranking
    rank: t.integer(), // Overall rank among all attempts
    percentile: t.real(), // Percentile score

    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("test_attempts_user_idx").on(table.userId),
    t.index("test_attempts_test_idx").on(table.testId),
    t.index("test_attempts_user_test_idx").on(table.userId, table.testId),
  ]
);

// User's answers in a test attempt
export const testAttemptAnswers = table(
  "test_attempt_answers",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    attemptId: t
      .uuid("attempt_id")
      .notNull()
      .references(() => testAttempts.id, { onDelete: "cascade" }),
    questionId: t
      .uuid("question_id")
      .notNull()
      .references(() => testQuestions.id, { onDelete: "cascade" }),

    // Selected answer
    selectedOptionId: t
      .uuid("selected_option_id")
      .references(() => testQuestionOptions.id),
    textAnswer: t.text("text_answer"), // For fill-in-the-blank or numerical

    // Evaluation
    isCorrect: t.boolean("is_correct"),
    marksAwarded: t.real("marks_awarded").default(0),

    // Time tracking
    timeSpentSeconds: t.integer("time_spent_seconds").default(0),

    // Review status
    isMarkedForReview: t.boolean("is_marked_for_review").default(false),
    isSkipped: t.boolean("is_skipped").default(false),

    answeredAt: t.timestamp("answered_at"),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    t.index("test_attempt_answers_attempt_idx").on(table.attemptId),
    t.index("test_attempt_answers_question_idx").on(table.questionId),
    t
      .uniqueIndex("unique_attempt_question")
      .on(table.attemptId, table.questionId),
  ]
);

// ==================== TEST PLATFORM RELATIONS ====================

export const testSeriesRelations = relations(testSeries, ({ many, one }) => ({
  organization: one(organization, {
    fields: [testSeries.organizationId],
    references: [organization.id],
  }),
  tests: many(tests),
  enrollments: many(userTestSeriesMapping),
}));

export const testsRelations = relations(tests, ({ one, many }) => ({
  testSeries: one(testSeries, {
    fields: [tests.testSeriesId],
    references: [testSeries.id],
  }),
  organization: one(organization, {
    fields: [tests.organizationId],
    references: [organization.id],
  }),
  sections: many(testSections),
  attempts: many(testAttempts),
}));

export const testSectionsRelations = relations(
  testSections,
  ({ one, many }) => ({
    test: one(tests, {
      fields: [testSections.testId],
      references: [tests.id],
    }),
    questions: many(testQuestions),
  })
);

export const testQuestionsRelations = relations(
  testQuestions,
  ({ one, many }) => ({
    section: one(testSections, {
      fields: [testQuestions.sectionId],
      references: [testSections.id],
    }),
    organization: one(organization, {
      fields: [testQuestions.organizationId],
      references: [organization.id],
    }),
    options: many(testQuestionOptions),
    answers: many(testAttemptAnswers),
  })
);

export const testQuestionOptionsRelations = relations(
  testQuestionOptions,
  ({ one }) => ({
    question: one(testQuestions, {
      fields: [testQuestionOptions.questionId],
      references: [testQuestions.id],
    }),
  })
);

export const userTestSeriesMappingRelations = relations(
  userTestSeriesMapping,
  ({ one }) => ({
    user: one(user, {
      fields: [userTestSeriesMapping.userId],
      references: [user.id],
    }),
    testSeries: one(testSeries, {
      fields: [userTestSeriesMapping.testSeriesId],
      references: [testSeries.id],
    }),
    organization: one(organization, {
      fields: [userTestSeriesMapping.organizationId],
      references: [organization.id],
    }),
    order: one(orders, {
      fields: [userTestSeriesMapping.orderId],
      references: [orders.id],
    }),
  })
);

export const testAttemptsRelations = relations(
  testAttempts,
  ({ one, many }) => ({
    user: one(user, {
      fields: [testAttempts.userId],
      references: [user.id],
    }),
    test: one(tests, {
      fields: [testAttempts.testId],
      references: [tests.id],
    }),
    answers: many(testAttemptAnswers),
  })
);

export const testAttemptAnswersRelations = relations(
  testAttemptAnswers,
  ({ one }) => ({
    attempt: one(testAttempts, {
      fields: [testAttemptAnswers.attemptId],
      references: [testAttempts.id],
    }),
    question: one(testQuestions, {
      fields: [testAttemptAnswers.questionId],
      references: [testQuestions.id],
    }),
    selectedOption: one(testQuestionOptions, {
      fields: [testAttemptAnswers.selectedOptionId],
      references: [testQuestionOptions.id],
    }),
  })
);
