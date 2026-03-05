
export interface IFlashcard {
  question: string;
  answer: string;
  image?: {
    public_id: string;
    secure_url: string;
  };
  topicId: string;
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
  page?: string;
  limit?: string;
  sort?: string;
  topicId?: string;
  status?: string;
}
