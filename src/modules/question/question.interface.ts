
    //TODO: customize as needed
    
    export interface IQuestion {
  _id: string;
  title: string;
  description: string;
  status?: string;
  isDeleted?: boolean;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateQuestion {
  title: string;
  description?: string;
  status?: string;
}
