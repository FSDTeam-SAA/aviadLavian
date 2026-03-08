import { z } from "zod";
import { Types } from "mongoose";

// Helper to transform comma-separated string or array to array of strings/ObjectIds
const topicIdsSchema = z.union([
    z.array(z.string().trim()).transform((arr) =>
        arr.map((val) => (Types.ObjectId.isValid(val) ? new Types.ObjectId(val) : val))
    ),
    z.string().transform((val) => {
        let items: string[];
        try {
            // Try parsing as JSON first (if sent as JSON.stringify)
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) items = parsed.map((s: any) => String(s).trim());
            else items = val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];
        } catch {
            // Fallback to comma-separated string
            items = val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];
        }
        return items.map((item) => (Types.ObjectId.isValid(item) ? new Types.ObjectId(item) : item));
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
