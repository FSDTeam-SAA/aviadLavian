export type IProgressOverview = {
  totalUsers?: number;
  totalQuestions?: number;
  totalFlashcards?: number;
  totalArticles?: number;
  totalQuiz?: number;
};

export type ITopStudentQuery = {
  page?: number;
  limit?: number;
};

export type ITopStudentResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: {
    _id: string;
    name: string;
    email: string;
    profileImage: string | null;
    totalQuizzes: number;
    totalQuestions: number;
    performance: number;
  }[];
};