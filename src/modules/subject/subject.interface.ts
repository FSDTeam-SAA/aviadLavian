export interface ISubject {
    _id: string;
    title: string;
    description: string;
    image: {
        public_id: string;
        secure_url: string;
    };
    labelsId: string[];
    status: string;
    isDeleted: boolean;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

//create category payload
export interface ICreateSubject {
    name: string;
    description: string;
    image?: {
        public_id: string;
        secure_url: string;
    };
    status?: string;
}


export interface IUpdateSubject {
    title?: string;
    description?: string;
    image?: {
        public_id: string;
        secure_url: string;
    };
    status?: string;
}