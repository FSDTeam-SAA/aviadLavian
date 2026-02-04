
export interface IFlashcard {
  question: string;
  answer: string;
  topiciD: string;
  difficulty: "easy" | "medium" | "hard";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateFlashcard {
  title: string;
  description?: string;
  status?: string;
}
