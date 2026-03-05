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

  totalAttempts?: number;
  correctAttempts?: number;

  explanation: string;

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
  marks?: number;
  isHidden?: boolean;
  isDeleted?: boolean;
}
