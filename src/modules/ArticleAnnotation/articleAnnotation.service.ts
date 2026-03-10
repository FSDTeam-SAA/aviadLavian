import { ArticleAnnotationModel } from "./articleAnnotation.model";
import { IArticleAnnotation } from "./articleAnnotation.interface";

/**
 * Upsert annotations (highlights/notes) for a specific user and article.
 */
const upsertAnnotation = async (
    userId: string,
    articleId: string,
    data: Partial<Pick<IArticleAnnotation, "highlights" | "notes">>
) => {
    const updatedAnnotation = await ArticleAnnotationModel.findOneAndUpdate(
        { userId, articleId },
        { 
            $set: { 
                ...data,
                userId, // Ensure these are set if creating
                articleId 
            } 
        },
        { upsert: true, new: true, runValidators: true }
    );
    return updatedAnnotation;
};

/**
 * Get annotations for a specific article and user.
 */
const getAnnotationByArticle = async (userId: string, articleId: string) => {
    const annotation = await ArticleAnnotationModel.findOne({ userId, articleId });
    return annotation || { highlights: [], notes: [] }; // Return empty structure if not found
};

export const articleAnnotationService = {
    upsertAnnotation,
    getAnnotationByArticle,
};
