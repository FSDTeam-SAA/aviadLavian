import { z } from "zod";

export const createFlashcardProgressSchema = z.object({
  flashcardId: z.string().min(1, "flashcardId is required").trim(),
  result: z.enum(["wrong", "unknown", "correct"]),
  customInterval: z
    .string()
    .regex(
      /^\d+(m|h|d)$/,
      "Invalid customInterval format. Use examples: 1m, 10m, 1h, 6h, 1d, 3d"
    )
    .optional(),
}).strict();