import { ObjectId } from "mongoose";

    
    export interface ISubCategory {
  _id: string;
  title: string;
  description: string;
  categoryId: ObjectId;
  topicsId: string[];
  image?: {
    public_id: string;
    secure_url: string;
  }
  status?: string;
  isDeleted?: boolean;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateSubCategory {
  title: string;
  description?: string;
  status?: string;
}
