import { z } from "zod";

// Helper to transform comma-separated string to array
const commaStringToArray = z
  .union([
    z.array(z.string().trim()),
    z.string().transform((val) =>
      val
        ? val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    ),
  ])
  .optional()
  .default([]);

export const createInjurySchema = z
  .object({
    Id: z
      .string()
      .min(1, "Id is required")
      .max(50, "Id cannot exceed 50 characters")
      .transform((val) => val.trim()),

    Name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name cannot exceed 200 characters")
      .transform((val) => val.trim()),

    Primary_Body_Region: z
      .string()
      .min(1, "Primary Body Region is required")
      .max(100, "Primary Body Region cannot exceed 100 characters")
      .transform((val) => val.trim()),

    Secondary_Body_Region: z
      .string()
      .max(100, "Secondary Body Region cannot exceed 100 characters")
      .transform((val) => val.trim())
      .optional()
      .default(""),

    Acuity: z
      .string()
      .max(50, "Acuity cannot exceed 50 characters")
      .transform((val) => val.trim())
      .optional()
      .default(""),

    Age_Group: z
      .string()
      .max(50, "Age Group cannot exceed 50 characters")
      .transform((val) => val.trim())
      .optional()
      .default(""),

    Tissue_Type: commaStringToArray,

    Etiology_Mechanism: z
      .string()
      .max(100, "Etiology Mechanism cannot exceed 100 characters")
      .transform((val) => val.trim())
      .optional()
      .default(""),

    Common_Sports: commaStringToArray,

    Synonyms_Abbreviations: commaStringToArray,

    Importance_Level: z
      .string()
      .max(50, "Importance Level cannot exceed 50 characters")
      .transform((val) => val.trim())
      .optional()
      .default(""),

    Description: z
      .string()
      .max(2000, "Description cannot exceed 2000 characters")
      .transform((val) => val.trim())
      .optional()
      .default(""),

    Video_URL: z
      .string()
      .max(500, "Video URL cannot exceed 500 characters")
      .transform((val) => val.trim())
      .optional()
      .default(""),

    Image_URL: z
      .string()
      .max(500, "Image URL cannot exceed 500 characters")
      .transform((val) => val.trim())
      .optional()
      .default(""),

    Tags_Keywords: commaStringToArray,
  })
  .passthrough();

export const updateInjurySchema = z
  .object({
    Name: z
      .string()
      .min(1, "Name cannot be empty")
      .max(200, "Name cannot exceed 200 characters")
      .transform((val) => val.trim())
      .optional(),

    Primary_Body_Region: z
      .string()
      .min(1, "Primary Body Region cannot be empty")
      .max(100, "Primary Body Region cannot exceed 100 characters")
      .transform((val) => val.trim())
      .optional(),

    Secondary_Body_Region: z
      .string()
      .max(100, "Secondary Body Region cannot exceed 100 characters")
      .transform((val) => val.trim())
      .optional(),

    Acuity: z
      .string()
      .max(50, "Acuity cannot exceed 50 characters")
      .transform((val) => val.trim())
      .optional(),

    Age_Group: z
      .string()
      .max(50, "Age Group cannot exceed 50 characters")
      .transform((val) => val.trim())
      .optional(),

    Tissue_Type: commaStringToArray,

    Etiology_Mechanism: z
      .string()
      .max(100, "Etiology Mechanism cannot exceed 100 characters")
      .transform((val) => val.trim())
      .optional(),

    Common_Sports: commaStringToArray,

    Synonyms_Abbreviations: commaStringToArray,

    Importance_Level: z
      .string()
      .max(50, "Importance Level cannot exceed 50 characters")
      .transform((val) => val.trim())
      .optional(),

    Description: z
      .string()
      .max(2000, "Description cannot exceed 2000 characters")
      .transform((val) => val.trim())
      .optional(),

    Video_URL: z
      .string()
      .max(500, "Video URL cannot exceed 500 characters")
      .transform((val) => val.trim())
      .optional(),

    Image_URL: z
      .string()
      .max(500, "Image URL cannot exceed 500 characters")
      .transform((val) => val.trim())
      .optional(),

    Tags_Keywords: commaStringToArray,
  })
  .passthrough();

// CSV file validation
export const csvUploadSchema = z.object({}).strict();
