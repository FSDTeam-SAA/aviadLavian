import { Types } from "mongoose";

export interface IHighlight {
    id: string; // Unique identifier (client-side generated or index)
    text: string;
    range: any; // Dynamic range (offsets or Tiptap path)
    color?: string;
}

export interface INote {
    id: string;
    content: string;
}

export interface IArticleAnnotation {
    userId: Types.ObjectId;
    articleId: Types.ObjectId;
    highlights: IHighlight[];
    notes: INote[];
}
