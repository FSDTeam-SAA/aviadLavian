import { z } from "zod";

// Helper to transform comma-separated string or array to array
const topicIdsSchema = z.union([
    z.array(z.string().trim()),
    z.string().transform((val) => {
        try {
            // Try parsing as JSON first (if sent as JSON.stringify)
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            // Fallback to comma-separated string
        }
        return val
            ? val
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
    }),
]);

export const createArticleSchema = z.object({
    name: z.string().min(1, "Name is required").transform((val) => val.trim()),
    topicIds: topicIdsSchema,
    description: z.string().min(1, "Description is required").transform((val) => val.trim()),
    isActive: z
        .string()
        .optional()
        .transform((val) => val === "true"),
});

export const updateArticleSchema = z.object({
    name: z.string().optional().transform((val) => val?.trim()),
    topicIds: topicIdsSchema.optional(),
    description: z.string().optional().transform((val) => val?.trim()),
    isActive: z
        .string()
        .optional()
        .transform((val) => (val === undefined ? undefined : val === "true")),
});
