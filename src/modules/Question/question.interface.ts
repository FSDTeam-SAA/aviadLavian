import { Types } from "mongoose";

export interface IOption {
  _id: Types.ObjectId;
  text: string;
  isCorrect: boolean;
  selectedCount?: number;
}

export interface IQuestion {
  articleId: Types.ObjectId;
  topicId: string;
  questionText: string;
  options: IOption[];
  difficulty: "easy" | "medium" | "hard";
  totalAttempts?: number;
  correctAttempts?: number;

  explanation: string;
  keyPoints: string[];
  marks: number;
  isHidden: boolean;
  isDeleted?: boolean;
  createdBy: Types.ObjectId;
}

export interface IUpdateQuestion {
  articleId?: Types.ObjectId;
  topicId?: string;
  questionText?: string;
  explanation?: string;
  keyPoints?: string[];
  difficulty?: "easy" | "medium" | "hard";
  marks?: number;
  isHidden?: boolean;
  isDeleted?: boolean;
}
