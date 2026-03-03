import { z } from "zod";

// Helper for MongoDB ObjectID validation
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// 1. Validation for submitting an answer
export const submitAnswerValidation = z.object({
  questionId: objectIdSchema,

  selectedOption: z
    .number()
    .int()
    .min(0, "Selected option must be 0 or greater")
    .max(10, "Selected option must be 10 or less"),

  timeSpent: z
    .number()
    .int()
    .min(0, "Time spent cannot be negative")
    .max(7200, "Time spent cannot exceed 2 hours"),

  isBookmarked: z.boolean().optional().default(false),
});

// 2. Validation for updating bookmark
export const updateBookmarkValidation = z.object({
  isBookmarked: z.boolean(),
});

// 3. Validation for query parameters
// We use .coerce because URL query params (req.query) arrive as strings
export const getAttemptsQueryValidation = z.object({
  examAttemptId: objectIdSchema.optional(),

  isBookmarked: z.coerce.boolean().optional(),
  isCorrect: z.coerce.boolean().optional(),

  page: z.coerce.number().int().min(1, "Page must be 1 or greater").default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be 1 or greater")
    .max(100, "Limit cannot exceed 100")
    .default(20),
});

// 4. Validation for ID parameters
export const attemptIdValidation = z.object({
  attemptId: objectIdSchema,
});

// 5. Validation for questionAttemptId parameter
export const questionAttemptIdValidation = z.object({
  questionAttemptId: objectIdSchema,
});

// TypeScript Type Inference
export type SubmitAnswerInput = z.infer<typeof submitAnswerValidation>;
export type GetAttemptsQuery = z.infer<typeof getAttemptsQueryValidation>;
