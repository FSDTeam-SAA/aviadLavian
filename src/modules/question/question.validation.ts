import { z } from "zod";
//TODO: customize as needed
export const createQuestionSchema = z.object({
  title: z.string().min(3).max(50).transform(val => val.trim()),
  description: z.string().max(500).optional().transform(val => val?.trim()),
});
