import { Types } from "mongoose";

export interface IFile {
    public_id: string;
    secure_url: string;
}

export interface IArticle {
    name: string;
    topicIds: string[];
    description: string;
    image?: IFile;
    video?: IFile;
    isActive: boolean;
}

export interface IGetAllArticlesParams {
    page?: string;
    limit?: string;
    sort?: "accending" | "decending";
    topicId?: string;
    name?: string;
}
