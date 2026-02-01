import mongoose from "mongoose";

export interface ITopic {
  _id: string;
  title: string;
  description: string;
  labelId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  articlesId: string[];
  quizsId: string[];
  flashcardsId: string[];
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

export interface ICreateTopic {
  title: string;
  description?: string;
  labelId: mongoose.Types.ObjectId;
  status?: string;
}
