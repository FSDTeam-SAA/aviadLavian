import { z } from "zod";
import mongoose from "mongoose";

export const createTopicSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title cannot exceed 50 characters")
    .transform((val) => val.trim()),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .transform((val) => val?.trim()),

  labelId: z
    .string()
    .nonempty({ message: "labelId is required" })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid labelId",
    }),

});


export const updateTopicSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title cannot exceed 50 characters")
    .optional()
    .transform((val) => val?.trim()),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .transform((val) => val?.trim()),

  status: z
    .string()
    .optional()
    .transform((val) => val?.trim()),
});