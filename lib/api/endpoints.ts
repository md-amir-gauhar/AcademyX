export const endpoints = {
  auth: {
    getOtp: "/auth/get-otp",
    verifyOtp: "/auth/verify-otp",
    refreshToken: "/auth/refresh-token",
  },
  orgConfig: (slug: string) => `/organization-config/${slug}`,
  batches: {
    list: "/batches",
    mine: "/batches/my-batches",
    byIdOrSlug: (idOrSlug: string) => `/batches/${idOrSlug}`,
    schedules: (batchId: string) => `/batches/${batchId}/schedules`,
    checkout: (id: string) => `/batches/${id}/checkout`,
    enrollFree: (batchId: string) => `/batches/${batchId}/enroll-free`,
    verifyPayment: "/batches/verify-payment",
  },
  subjects: {
    byBatch: (batchId: string) => `/subjects/batch/${batchId}`,
    byId: (id: string) => `/subjects/${id}`,
  },
  chapters: {
    bySubject: (subjectId: string) => `/chapters/subject/${subjectId}`,
    byId: (id: string) => `/chapters/${id}`,
  },
  topics: {
    byChapter: (chapterId: string) => `/topics/chapter/${chapterId}`,
    byId: (id: string) => `/topics/${id}`,
  },
  contents: {
    byTopic: (topicId: string) => `/contents/topic/${topicId}`,
    byId: (id: string) => `/contents/${id}`,
  },
  contentProgress: {
    recentlyWatched: "/content/recently-watched",
    track: (contentId: string) => `/content/${contentId}/progress`,
    get: (contentId: string) => `/content/${contentId}/progress`,
    stats: "/content/watch-stats",
    complete: (contentId: string) => `/content/${contentId}/complete`,
    batchProgress: "/content/batch-progress",
  },
  schedules: {
    feed: "/schedules",
    byId: (id: string) => `/schedules/${id}`,
    byTopic: (topicId: string) => `/schedules/topic/${topicId}`,
    byBatch: (batchId: string) => `/schedules/batch/${batchId}`,
  },
  testSeries: {
    list: "/test-series",
    byId: (id: string) => `/test-series/${id}`,
  },
  tests: {
    byId: (id: string) => `/tests/${id}`,
  },
  attempts: {
    start: (testId: string) => `/attempts/start/${testId}`,
    submit: (attemptId: string) => `/attempts/${attemptId}/submit`,
    byId: (attemptId: string) => `/attempts/${attemptId}`,
    mine: "/attempts/mine",
  },
  profile: {
    me: "/profile",
  },
  orders: {
    mine: "/orders",
    byId: (id: string) => `/orders/${id}`,
  },
  upload: {
    avatar: "/upload/avatar",
  },
} as const;
