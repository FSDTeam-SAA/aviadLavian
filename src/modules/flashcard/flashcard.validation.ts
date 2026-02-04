import { z } from "zod";

export const createFlashcardSchema = z.object({
  question: z
    .string()
    .min(3, "Question must be at least 3 characters")
    .max(100, "Question cannot exceed 100 characters")
    .transform((val) => val.trim()),

  answer: z
    .string()
    .min(3, "Answer must be at least 3 characters")
    .max(150, "Answer cannot exceed 150 characters")
    .transform((val) => val.trim()),

  topicId: z
    .array(
      z
        .string()
        .min(1, "Topic ID cannot be empty")
        .max(50, "Topic ID cannot exceed 50 characters")
        .transform((val) => val.trim())
    )
    .min(1, "At least one topic ID is required"),

  difficulty: z.enum(["easy", "medium", "hard"]),
}).strict();

export const updateFlashcardSchema = z.object({
  question: z
    .string()
    .min(3, "Question must be at least 3 characters")
    .max(100, "Question cannot exceed 100 characters")
    .transform((val) => val.trim())
    .optional(),

  answer: z
    .string()
    .min(3, "Answer must be at least 3 characters")
    .max(150, "Answer cannot exceed 150 characters")
    .transform((val) => val.trim())
    .optional(),

  difficulty: z.enum(["easy", "medium", "hard"]).optional(),

  addTopicId: z
    .array(
      z
        .string()
        .min(1, "Topic ID cannot be empty")
        .max(50, "Topic ID cannot exceed 50 characters")
        .transform((val) => val.trim())
    )
    .optional(),

  removeTopicId: z
    .array(
      z
        .string()
        .min(1, "Topic ID cannot be empty")
        .max(50, "Topic ID cannot exceed 50 characters")
        .transform((val) => val.trim())
    )
    .optional(),

  isActive: z.enum(["true", "false"]).optional(),
})
  .strict()



