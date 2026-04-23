import { apiGet } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Chapter, Content, Subject, Topic } from "@/types/course";

export const listSubjects = (batchId: string) =>
  apiGet<Subject[]>(endpoints.subjects.byBatch(batchId));
export const getSubject = (id: string) =>
  apiGet<Subject>(endpoints.subjects.byId(id));

export const listChapters = (subjectId: string) =>
  apiGet<Chapter[]>(endpoints.chapters.bySubject(subjectId));
export const getChapter = (id: string) =>
  apiGet<Chapter>(endpoints.chapters.byId(id));

export const listTopics = (chapterId: string) =>
  apiGet<Topic[]>(endpoints.topics.byChapter(chapterId));
export const getTopic = (id: string) => apiGet<Topic>(endpoints.topics.byId(id));

export const listContents = (topicId: string) =>
  apiGet<Content[]>(endpoints.contents.byTopic(topicId));
export const getContent = (id: string) =>
  apiGet<Content>(endpoints.contents.byId(id));
