import { db } from "../../db";
import {
  teachers,
  batches,
  batchTeacherMapping,
  teacherSubjectMapping,
} from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import { CacheManager } from "../cache.service";

interface CreateTeacherInput {
  organizationId: string;
  batchIds?: string[];
  subjectIds?: string[];
  name: string;
  highlights?: any;
  imageUrl?: string;
  subjects?: string[];
}

interface UpdateTeacherInput {
  name?: string;
  highlights?: any;
  imageUrl?: string;
  subjects?: string[];
  subjectIds?: string[];
}

interface AssignTeacherToBatchInput {
  teacherId: string;
  batchId: string;
  organizationId: string;
}

export const createTeacher = async (input: CreateTeacherInput) => {
  // Verify batches exist
  if (input.batchIds && input.batchIds.length > 0) {
    for (const batchId of input.batchIds) {
      const batch = await db.query.batches.findFirst({
        where: and(
          eq(batches.id, batchId),
          eq(batches.organizationId, input.organizationId)
        ),
      });

      if (!batch) {
        throw new ApiError(`Batch ${batchId} not found`, HTTP_STATUS.NOT_FOUND);
      }
    }
  }

  // Create teacher
  const [newTeacher] = await db
    .insert(teachers)
    .values({
      organizationId: input.organizationId,
      name: input.name,
      highlights: input.highlights,
      imageUrl: input.imageUrl,
      subjects: input.subjects,
      updatedAt: new Date(),
    })
    .returning();

  // Assign to batches if provided
  if (input.batchIds && input.batchIds.length > 0) {
    await db.insert(batchTeacherMapping).values(
      input.batchIds.map((batchId) => ({
        teacherId: newTeacher.id,
        batchId,
        organizationId: input.organizationId,
      }))
    );
  }

  // Assign to subjects if provided
  if (input.subjectIds && input.subjectIds.length > 0) {
    await db.insert(teacherSubjectMapping).values(
      input.subjectIds.map((subjectId) => ({
        teacherId: newTeacher.id,
        subjectId,
      }))
    );
  }

  // Invalidate teacher caches
  await CacheManager.invalidateTeacher(newTeacher.id, input.organizationId);

  return newTeacher;
};

/**
 * Get all teachers for an organization with their subjects
 */
export const getAllTeachers = async (organizationId: string) => {
  const teachersList = await db.query.teachers.findMany({
    where: eq(teachers.organizationId, organizationId),
    with: {
      subjectMappings: {
        with: {
          subject: true,
        },
      },
    },
    orderBy: (teachers, { asc }) => [asc(teachers.createdAt)],
  });

  // Format response to include subjects array
  return teachersList.map((teacher: any) => ({
    ...teacher,
    subjects: teacher.subjectMappings?.map((m: any) => m.subject) || [],
    subjectMappings: undefined, // Remove the mapping structure
  }));
};

/**
 * Get a single teacher by ID with subjects
 */
export const getTeacherById = async (
  teacherId: string,
  organizationId: string
) => {
  const teacher = await db.query.teachers.findFirst({
    where: and(
      eq(teachers.id, teacherId),
      eq(teachers.organizationId, organizationId)
    ),
    with: {
      subjectMappings: {
        with: {
          subject: true,
        },
      },
    },
  });

  if (!teacher) {
    throw new ApiError("Teacher not found", HTTP_STATUS.NOT_FOUND);
  }

  return {
    ...teacher,
    subjects:
      (teacher.subjectMappings as any)?.map((m: any) => m.subject) || [],
    subjectMappings: undefined,
  };
};

export const getTeachersByBatchId = async (
  batchId: string,
  organizationId: string
) => {
  const batch = await db.query.batches.findFirst({
    where: and(
      eq(batches.id, batchId),
      eq(batches.organizationId, organizationId)
    ),
  });

  if (!batch) {
    throw new ApiError("Batch not found", HTTP_STATUS.NOT_FOUND);
  }

  const mappings = await db.query.batchTeacherMapping.findMany({
    where: and(
      eq(batchTeacherMapping.batchId, batchId),
      eq(batchTeacherMapping.organizationId, organizationId)
    ),
    with: {
      teacher: true,
    },
  });

  return mappings.map((m: any) => m.teacher);
};

export const assignTeacherToBatch = async (
  input: AssignTeacherToBatchInput
) => {
  const teacher = await db.query.teachers.findFirst({
    where: and(
      eq(teachers.id, input.teacherId),
      eq(teachers.organizationId, input.organizationId)
    ),
  });

  if (!teacher) {
    throw new ApiError("Teacher not found", HTTP_STATUS.NOT_FOUND);
  }

  const batch = await db.query.batches.findFirst({
    where: and(
      eq(batches.id, input.batchId),
      eq(batches.organizationId, input.organizationId)
    ),
  });

  if (!batch) {
    throw new ApiError("Batch not found", HTTP_STATUS.NOT_FOUND);
  }

  const existing = await db.query.batchTeacherMapping.findFirst({
    where: and(
      eq(batchTeacherMapping.teacherId, input.teacherId),
      eq(batchTeacherMapping.batchId, input.batchId),
      eq(batchTeacherMapping.organizationId, input.organizationId)
    ),
  });

  if (existing) {
    throw new ApiError(
      "Teacher is already assigned to this batch",
      HTTP_STATUS.CONFLICT
    );
  }

  const [assignment] = await db
    .insert(batchTeacherMapping)
    .values({
      teacherId: input.teacherId,
      batchId: input.batchId,
      organizationId: input.organizationId,
    })
    .returning();

  // Invalidate teacher-batch caches
  await CacheManager.invalidateTeacherBatch(input.teacherId, input.batchId);

  return assignment;
};

export const removeTeacherFromBatch = async (
  teacherId: string,
  batchId: string,
  organizationId: string
) => {
  const mapping = await db.query.batchTeacherMapping.findFirst({
    where: and(
      eq(batchTeacherMapping.teacherId, teacherId),
      eq(batchTeacherMapping.batchId, batchId),
      eq(batchTeacherMapping.organizationId, organizationId)
    ),
  });

  if (!mapping) {
    throw new ApiError(
      "Teacher is not assigned to this batch",
      HTTP_STATUS.NOT_FOUND
    );
  }

  await db
    .delete(batchTeacherMapping)
    .where(eq(batchTeacherMapping.id, mapping.id));

  // Invalidate teacher-batch caches
  await CacheManager.invalidateTeacherBatch(teacherId, batchId);

  return { message: "Teacher removed from batch successfully" };
};

export const updateTeacher = async (
  teacherId: string,
  organizationId: string,
  input: UpdateTeacherInput
) => {
  const teacher = await db.query.teachers.findFirst({
    where: and(
      eq(teachers.id, teacherId),
      eq(teachers.organizationId, organizationId)
    ),
  });

  if (!teacher) {
    throw new ApiError("Teacher not found", HTTP_STATUS.NOT_FOUND);
  }

  // Update basic teacher info
  const [updatedTeacher] = await db
    .update(teachers)
    .set({
      name: input.name,
      highlights: input.highlights,
      imageUrl: input.imageUrl,
      subjects: input.subjects,
      updatedAt: new Date(),
    })
    .where(eq(teachers.id, teacherId))
    .returning();

  // Update subject mappings if provided
  if (input.subjectIds !== undefined) {
    // Remove existing subject mappings
    await db
      .delete(teacherSubjectMapping)
      .where(eq(teacherSubjectMapping.teacherId, teacherId));

    // Add new mappings
    if (input.subjectIds.length > 0) {
      await db.insert(teacherSubjectMapping).values(
        input.subjectIds.map((subjectId) => ({
          teacherId,
          subjectId,
        }))
      );
    }
  }

  // Invalidate teacher caches
  await CacheManager.invalidateTeacher(teacherId, organizationId);

  return updatedTeacher;
};

export const deleteTeacher = async (
  teacherId: string,
  organizationId: string
) => {
  const teacher = await db.query.teachers.findFirst({
    where: and(
      eq(teachers.id, teacherId),
      eq(teachers.organizationId, organizationId)
    ),
  });

  if (!teacher) {
    throw new ApiError("Teacher not found", HTTP_STATUS.NOT_FOUND);
  }

  await db.delete(teachers).where(eq(teachers.id, teacherId));

  // Invalidate teacher caches
  await CacheManager.invalidateTeacher(teacherId, organizationId);

  return { message: "Teacher deleted successfully" };
};
