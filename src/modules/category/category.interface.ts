export interface ICategory {
    _id: string;
    title: string;
    description: string;
    image: {
        public_id: string;
        secure_url: string;
    };
    subCategoriesId: string[];
    status: string;
    isDeleted: boolean;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

//create category payload
export interface ICreateCategory {
    name: string;
    description: string;
    image?: {
        public_id: string;
        secure_url: string;
    };
    status?: string;
}


export interface IUpdateCategory {
    title?: string;
    description?: string;
    image?: {
        public_id: string;
        secure_url: string;
    };
    status?: string;
}