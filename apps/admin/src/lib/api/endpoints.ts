export const endpoints = {
  auth: {
    register: "/auth/register",
    verifyEmail: "/auth/verify-email",
    setPassword: "/auth/set-password",
    resendVerification: "/auth/resend-verification",
    login: "/auth/login",
    inviteUser: "/auth/invite-user",
  },
  organizations: {
    create: "/organizations",
  },
  orgConfig: {
    get: "/organization-config",
    create: "/organization-config",
    update: "/organization-config",
    delete: "/organization-config",
    maintenance: "/organization-config/maintenance",
  },
  users: {
    list: "/users",
    delete: (userId: string) => `/users/${userId}`,
  },
  batches: {
    list: "/batches",
    byIdentifier: (identifier: string) => `/batches/${identifier}`,
    create: "/batches",
    update: (id: string) => `/batches/${id}`,
    delete: (id: string) => `/batches/${id}`,
    stats: (id: string) => `/batches/${id}/stats`,
  },
  teachers: {
    list: "/teachers",
    byId: (id: string) => `/teachers/${id}`,
    byBatch: (batchId: string) => `/teachers/batch/${batchId}`,
    create: "/teachers",
    update: (id: string) => `/teachers/${id}`,
    delete: (id: string) => `/teachers/${id}`,
    assignBatch: (teacherId: string, batchId: string) =>
      `/teachers/${teacherId}/batches/${batchId}`,
  },
  subjects: {
    byBatch: (batchId: string) => `/subjects/batch/${batchId}`,
    byId: (id: string) => `/subjects/${id}`,
    create: "/subjects",
    update: (id: string) => `/subjects/${id}`,
    delete: (id: string) => `/subjects/${id}`,
  },
  chapters: {
    bySubject: (subjectId: string) => `/chapters/subject/${subjectId}`,
    byId: (id: string) => `/chapters/${id}`,
    create: "/chapters",
    update: (id: string) => `/chapters/${id}`,
    delete: (id: string) => `/chapters/${id}`,
  },
  topics: {
    byChapter: (chapterId: string) => `/topics/chapter/${chapterId}`,
    byId: (id: string) => `/topics/${id}`,
    create: "/topics",
    update: (id: string) => `/topics/${id}`,
    delete: (id: string) => `/topics/${id}`,
  },
  contents: {
    byTopic: (topicId: string) => `/contents/topic/${topicId}`,
    byId: (id: string) => `/contents/${id}`,
    create: "/contents",
    update: (id: string) => `/contents/${id}`,
    delete: (id: string) => `/contents/${id}`,
  },
  schedules: {
    list: "/schedules",
    byId: (id: string) => `/schedules/${id}`,
    byTopic: (topicId: string) => `/schedules/topic/${topicId}`,
    byBatch: (batchId: string) => `/schedules/batch/${batchId}`,
    create: "/schedules",
    update: (id: string) => `/schedules/${id}`,
    updateStatus: (id: string) => `/schedules/${id}/status`,
    delete: (id: string) => `/schedules/${id}`,
  },
  testSeries: {
    list: "/test-series",
    byIdentifier: (identifier: string) => `/test-series/${identifier}`,
    tests: (id: string) => `/test-series/${id}/tests`,
    create: "/test-series",
    update: (id: string) => `/test-series/${id}`,
    delete: (id: string) => `/test-series/${id}`,
    stats: (id: string) => `/test-series/${id}/stats`,
  },
  tests: {
    create: "/tests",
    bySeriesId: (testSeriesId: string) =>
      `/tests/test-series/${testSeriesId}`,
    byIdentifier: (identifier: string) => `/tests/${identifier}`,
    details: (testId: string) => `/tests/${testId}/details`,
    update: (testId: string) => `/tests/${testId}`,
    delete: (testId: string) => `/tests/${testId}`,
    publish: (testId: string) => `/tests/${testId}/publish`,
    sections: {
      create: (testId: string) => `/tests/${testId}/sections`,
      list: (testId: string) => `/tests/${testId}/sections`,
      byId: (sectionId: string) => `/tests/sections/${sectionId}`,
      update: (sectionId: string) => `/tests/sections/${sectionId}`,
      delete: (sectionId: string) => `/tests/sections/${sectionId}`,
      reorder: (testId: string) => `/tests/${testId}/sections/reorder`,
    },
    questions: {
      create: (sectionId: string) =>
        `/tests/sections/${sectionId}/questions`,
      bulk: (sectionId: string) =>
        `/tests/sections/${sectionId}/questions/bulk`,
      list: (sectionId: string) =>
        `/tests/sections/${sectionId}/questions`,
      byId: (questionId: string) => `/tests/questions/${questionId}`,
      update: (questionId: string) => `/tests/questions/${questionId}`,
      delete: (questionId: string) => `/tests/questions/${questionId}`,
      reorder: (sectionId: string) =>
        `/tests/sections/${sectionId}/questions/reorder`,
    },
    options: {
      create: (questionId: string) =>
        `/tests/questions/${questionId}/options`,
      update: (questionId: string, optionId: string) =>
        `/tests/questions/${questionId}/options/${optionId}`,
      delete: (questionId: string, optionId: string) =>
        `/tests/questions/${questionId}/options/${optionId}`,
    },
  },
  upload: {
    signedUrl: "/upload/signed-url",
    batchSignedUrls: "/upload/batch-signed-urls",
    direct: "/upload",
  },
  media: {
    transcode: "/media/transcode",
    jobs: "/media/jobs",
    job: (id: string) => `/media/jobs/${id}`,
  },
  cache: {
    clear: "/cache/clear",
    stats: "/cache/stats",
    flush: "/cache/flush",
  },
} as const;
