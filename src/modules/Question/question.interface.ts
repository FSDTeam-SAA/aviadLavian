import { Types } from "mongoose";

export interface IOption {
  _id: Types.ObjectId;
  text: string;
  isCorrect: boolean;
}
export interface IQuestion {
  articleId: Types.ObjectId;
  questionText: string;
  options: IOption[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  isHidden: boolean;
  isDeleted?: boolean;
  createdBy: Types.ObjectId;
}
