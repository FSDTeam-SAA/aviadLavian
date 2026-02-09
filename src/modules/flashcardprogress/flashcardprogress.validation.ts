import { z } from "zod";

export const createFlashcardProgressSchema = z.object({
  flashcardId: z.string().min(1, "flashcardId is required").trim(),
  result: z.enum(["wrong", "unknown", "correct"]),
  customInterval: z.string().optional(),
}).strict();