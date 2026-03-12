import mongoose from "mongoose";

export interface IFlashcard {
  question: string;
  answer: string;
  image?: {
    public_id: string;
    secure_url: string;
  };
  topicId: mongoose.Types.ObjectId;
  difficulty: "easy" | "medium" | "hard";
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateFlashcard {
  question?: string;
  answer?: string;
  topicId?: string;
  difficulty?: string
}

export interface IUpdateFlashcard {
  title?: string;
  description?: string;
  status?: string;
  difficulty?: string
  isActive?: boolean
}



export interface GetAllFlashcardsParams {
  page?: string | number;
  limit?: string | number;
  sortBy?: "assend" | "dessce";
  filterBytopicId?: string;
  filterByAcuity?: string;
  filterByAgeGroup?: string;
  status?: "active" | "inactive";
  search?: string;
};