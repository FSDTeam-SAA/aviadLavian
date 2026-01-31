import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");


export const createSubCategorySchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title must be at most 50 characters")
    .transform(val => val.trim()),

  description: z
    .string()
    .max(500, "Description too long")
    .optional()
    .transform(val => val?.trim()),

  categoryId: objectId,

  topicsId: objectId.optional(),
  status: z
    .enum(["active", "inactive"])
    .optional()
    .default("active"),
});
