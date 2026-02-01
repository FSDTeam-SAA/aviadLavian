import { ObjectId } from "mongoose";

    
    export interface ILabel {
  _id: string;
  title: string;
  description: string;
  subjectId: ObjectId;
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

export interface ICreateLabel {
  title: string;
  description?: string;
  status?: string;
}

export interface IUpdateLabel {
  title?: string;
  description?: string;
  status?: string;
}
