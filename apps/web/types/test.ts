export interface EnrollmentDetails {
  enrolledAt: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface TestSeries {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  exam?: string | null;
  class?: string | null;
  language?: string | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  totalPrice: number;
  discountPercentage: number;
  discountedPrice: number;
  isFree?: boolean;
  totalTests?: number | null;
  durationDays?: number | null;
  isEnrolled?: boolean;
  isPurchased?: boolean;
  enrollmentDetails?: EnrollmentDetails | null;
}

export type QuestionType = "MCQ" | "TRUE_FALSE" | "NUMERICAL" | "FILL_BLANK";

export interface TestOption {
  id: string;
  text: string;
  imageUrl?: string | null;
  displayOrder: number;
  isCorrect?: boolean;
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface TestQuestion {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string | null;
  marks: number;
  negativeMarks: number;
  difficulty?: Difficulty;
  displayOrder: number;
  options: TestOption[];
  explanation?: string | null;
  explanationImageUrl?: string | null;
  sectionId?: string;
}

export interface TestSection {
  id: string;
  name: string;
  displayOrder: number;
  questions: TestQuestion[];
}

export interface TestSummary {
  id: string;
  title: string;
  slug: string;
  duration: number;
  durationMinutes?: number;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  isFree: boolean;
  attemptCount?: number;
  hasAttempted?: boolean;
}

export interface TestDetails extends TestSummary {
  testSeries?: { id: string; title: string; slug: string } | null;
  isEnrolled: boolean;
  message?: string;
}

export interface TestPreview extends TestSummary {
  sections: TestSection[];
  showAnswersAfterSubmit?: boolean;
}

export interface TestAnswer {
  id: string;
  questionId: string;
  selectedOptionId?: string | null;
  textAnswer?: string | null;
  timeSpentSeconds?: number | null;
  isMarkedForReview: boolean;
  isSkipped: boolean;
  isCorrect?: boolean | null;
  marksAwarded?: number | null;
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string | null;
  isCompleted: boolean;
  timeSpentSeconds?: number | null;
  totalScore?: number | null;
  percentage?: number | null;
  correctCount?: number | null;
  wrongCount?: number | null;
  skippedCount?: number | null;
  isPassed?: boolean | null;
  rank?: number | null;
  percentile?: number | null;
}

export interface TestAttemptRunner extends TestAttempt {
  test: TestPreview;
  answers: TestAnswer[];
}

export interface TestAttemptResult extends TestAttempt {
  test: TestPreview;
  answers: Array<TestAnswer & { question: TestQuestion; selectedOption?: TestOption | null }>;
}

export interface LeaderboardEntry {
  id: string;
  totalScore: number;
  percentage: number;
  submittedAt: string;
  user: { id: string; username: string | null };
}

export interface RecentCompletedAttempt extends TestAttempt {
  test: TestSummary & {
    testSeries?: { id: string; title: string; exam?: string | null } | null;
  };
}

export interface TestAttemptStats {
  totalTestsAttempted: number;
  totalTestsCompleted: number;
  totalTestsPassed: number;
  averageScore: number;
  averagePercentage: number;
  passRate: number;
  totalTimeSpentSeconds: number;
  totalTimeSpentHours: number;
  bestScore: number;
  bestPercentage: number;
  recentTrend: "improving" | "stable" | "declining";
}

export interface SubmitAnswerPayload {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  timeSpentSeconds?: number;
  isMarkedForReview?: boolean;
}

export interface TestSeriesCheckoutResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  seriesName: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}
