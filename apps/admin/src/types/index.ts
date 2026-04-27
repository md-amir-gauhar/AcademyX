export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface OrganizationConfig {
  id: string;
  organizationId: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  tagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  socialLinks?: Record<string, string>;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  maintenanceMode?: boolean;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  class: string;
  exam: string;
  language: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  discountPercentage?: number;
  status: string;
  faq?: Array<{ question: string; answer: string }>;
  teacherId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  imageUrl?: string;
  highlights?: unknown;
  subjects?: string[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  batchId: string;
  thumbnailUrl?: string;
  organizationId: string;
  createdAt: string;
}

export interface Chapter {
  id: string;
  name: string;
  subjectId: string;
  lectureCount: number;
  lectureDuration?: number;
  organizationId: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
  chapterId: string;
  organizationId: string;
  createdAt: string;
}

export interface Content {
  id: string;
  topicId: string;
  type: "Lecture" | "PDF";
  title?: string;
  videoUrl?: string;
  videoType?: "HLS" | "YOUTUBE";
  pdfUrl?: string;
  videoDuration?: number;
  isCompleted?: boolean;
  organizationId: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  topicId: string;
  batchId: string;
  subjectId: string;
  title: string;
  subjectName: string;
  youtubeLink?: string;
  /** UUID of a `MediaJob` if the schedule has an uploaded recording. */
  mediaJobId?: string;
  /** master.m3u8 URL — copied from the linked media job once it's READY. */
  hlsUrl?: string;
  scheduledAt: string;
  duration: number;
  description?: string;
  teacherId?: string;
  thumbnailUrl?: string;
  notifyBeforeMinutes?: number;
  tags?: string[];
  status: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export type MediaJobStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export interface MediaJob {
  id: string;
  organizationId: string;
  userId?: string;
  status: MediaJobStatus;
  sourceKey: string;
  sourceContentType?: string;
  outputPrefix?: string;
  hlsUrl?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
  progress: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestSeries {
  id: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  exam: string;
  totalPrice: number;
  discountPercentage?: number;
  isFree?: boolean;
  durationDays?: number;
  status: string;
  faq?: Array<{ question: string; answer: string }>;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Test {
  id: string;
  title: string;
  slug: string;
  description?: string;
  testSeriesId: string;
  duration: number;
  totalMarks: number;
  passingMarks?: number;
  isPublished: boolean;
  status: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestSection {
  id: string;
  testId: string;
  name: string;
  displayOrder: number;
  createdAt: string;
}

export interface TestQuestion {
  id: string;
  sectionId: string;
  text: string;
  type: "MCQ" | "TRUE_FALSE" | "FILL_BLANK" | "NUMERICAL";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  negativeMarks?: number;
  explanation?: string;
  displayOrder: number;
  options?: TestQuestionOption[];
  createdAt: string;
}

export interface TestQuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface CacheStats {
  isAvailable: boolean;
  keyCount: number;
  memoryUsed: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  organizationId: string;
  profileImage?: string;
  createdAt: string;
}
