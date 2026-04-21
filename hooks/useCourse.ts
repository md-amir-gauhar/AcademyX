"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getChapter,
  getContent,
  getSubject,
  getTopic,
  listChapters,
  listContents,
  listSubjects,
  listTopics,
} from "@/services/courseService";
import { useAuthStore } from "@/store/authStore";

export const courseKeys = {
  subjects: (batchId: string) => ["course", "subjects", batchId] as const,
  subject: (id: string) => ["course", "subject", id] as const,
  chapters: (subjectId: string) => ["course", "chapters", subjectId] as const,
  chapter: (id: string) => ["course", "chapter", id] as const,
  topics: (chapterId: string) => ["course", "topics", chapterId] as const,
  topic: (id: string) => ["course", "topic", id] as const,
  contents: (topicId: string) => ["course", "contents", topicId] as const,
  content: (id: string) => ["course", "content", id] as const,
};

export function useSubjects(batchId: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: batchId ? courseKeys.subjects(batchId) : ["course", "subjects", "noop"],
    queryFn: () => {
      if (!batchId) throw new Error("batchId required");
      return listSubjects(batchId);
    },
    enabled: isAuthed && Boolean(batchId),
    staleTime: 5 * 60_000,
  });
}

export function useSubject(id: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: id ? courseKeys.subject(id) : ["course", "subject", "noop"],
    queryFn: () => {
      if (!id) throw new Error("id required");
      return getSubject(id);
    },
    enabled: isAuthed && Boolean(id),
  });
}

export function useChapters(subjectId: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: subjectId
      ? courseKeys.chapters(subjectId)
      : ["course", "chapters", "noop"],
    queryFn: () => {
      if (!subjectId) throw new Error("subjectId required");
      return listChapters(subjectId);
    },
    enabled: isAuthed && Boolean(subjectId),
  });
}

export function useChapter(id: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: id ? courseKeys.chapter(id) : ["course", "chapter", "noop"],
    queryFn: () => {
      if (!id) throw new Error("id required");
      return getChapter(id);
    },
    enabled: isAuthed && Boolean(id),
  });
}

export function useTopics(chapterId: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: chapterId
      ? courseKeys.topics(chapterId)
      : ["course", "topics", "noop"],
    queryFn: () => {
      if (!chapterId) throw new Error("chapterId required");
      return listTopics(chapterId);
    },
    enabled: isAuthed && Boolean(chapterId),
  });
}

export function useTopic(id: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: id ? courseKeys.topic(id) : ["course", "topic", "noop"],
    queryFn: () => {
      if (!id) throw new Error("id required");
      return getTopic(id);
    },
    enabled: isAuthed && Boolean(id),
  });
}

export function useContents(topicId: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: topicId
      ? courseKeys.contents(topicId)
      : ["course", "contents", "noop"],
    queryFn: () => {
      if (!topicId) throw new Error("topicId required");
      return listContents(topicId);
    },
    enabled: isAuthed && Boolean(topicId),
  });
}

export function useContent(id: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: id ? courseKeys.content(id) : ["course", "content", "noop"],
    queryFn: () => {
      if (!id) throw new Error("id required");
      return getContent(id);
    },
    enabled: isAuthed && Boolean(id),
  });
}
