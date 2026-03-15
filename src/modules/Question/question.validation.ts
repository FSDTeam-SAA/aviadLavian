import { z } from "zod";

// ─── Reusable ────────────────────────────────────────────────────────────────

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId format");

const optionSchema = z.object({
  text: z.string().trim().min(1, "Option text cannot be empty"),
  isCorrect: z.boolean(),
});

// ─── Create Question ─────────────────────────────────────────────────────────

export const createQuestionSchema = z.object({
  body: z.object({
    articleId: objectId,

    topicIds: z.array(objectId).min(1, "At least one topicId is required"),

    questionText: z.string().trim().min(1, "Question text cannot be empty"),

    options: z
      .array(optionSchema)
      .min(2, "A question must have at least 2 options")
      .refine(
        (opts) => {
          const texts = opts.map((o) => o.text.toLowerCase().trim());
          return texts.length === new Set(texts).size;
        },
        { message: "Duplicate options are not allowed" },
      )
      .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
        message: "Exactly one option must be marked as correct",
      }),

    explanation: z.string().trim().min(1, "Explanation cannot be empty"),

    keyPoints: z.array(z.string().trim().min(1)).optional().default([]),

    marks: z.number().int().positive().optional().default(1),

    difficulty: z.enum(["easy", "medium", "hard"]).optional().default("easy"),

    isHidden: z.boolean().optional().default(false),
  }),
});



export const updateQuestionSchema = z.object({
  params: z.object({ id: objectId }),

  body: z
    .object({
      articleId: objectId.optional(),

      topicIds: z
        .array(objectId)
        .min(1, "At least one topicId is required")
        .optional(),

      questionText: z
        .string()
        .trim()
        .min(1, "Question text cannot be empty")
        .optional(),

      options: z
        .array(optionSchema)
        .min(2, "A question must have at least 2 options")
        .refine(
          (opts) => {
            const texts = opts.map((o) => o.text.toLowerCase().trim());
            return texts.length === new Set(texts).size;
          },
          { message: "Duplicate options are not allowed" },
        )
        .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
          message: "Exactly one option must be marked as correct",
        })
        .optional(),

      explanation: z
        .string()
        .trim()
        .min(1, "Explanation cannot be empty")
        .optional(),

      keyPoints: z.array(z.string().trim().min(1)).optional(),

      marks: z.number().int().positive().optional(),

      difficulty: z.enum(["easy", "medium", "hard"]).optional(),

      isHidden: z.boolean().optional(),

      isDeleted: z.boolean().optional(),
    })
    .strict(),
});

// ─── Update Single Option ─────────────────────────────────────────────────────

export const updateOptionSchema = z.object({
  params: z.object({
    questionId: objectId,
    optionId: objectId,
  }),

  body: z
    .object({
      text: z.string().trim().min(1, "Option text cannot be empty").optional(),
      isCorrect: z.boolean().optional(),
    })
    .strict()
    .refine((data) => data.text !== undefined || data.isCorrect !== undefined, {
      message: "At least one of 'text' or 'isCorrect' must be provided",
    }),
});

// ─── Get / Delete / Hide by ID ────────────────────────────────────────────────

export const questionIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

// ─── Get All Questions (query filters) ───────────────────────────────────────

export const getAllQuestionsSchema = z.object({
  query: z.object({
    articleId: objectId.optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    isHidden: z.enum(["true", "false"]).optional(),
    acuity: z.string().trim().optional(),
    ageGroup: z.string().trim().optional(),
    secondaryBodyRegion: z.string().trim().optional(),
    tissueType: z.string().trim().optional(),
    search: z.string().trim().optional(),
    page: z
      .string()
      .regex(/^\d+$/, "page must be a positive integer")
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, "limit must be a positive integer")
      .optional(),
  }),
});

// ─── Exported Types ───────────────────────────────────────────────────────────

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type UpdateOptionInput = z.infer<typeof updateOptionSchema>;
export type GetAllQuestionsInput = z.infer<typeof getAllQuestionsSchema>;
