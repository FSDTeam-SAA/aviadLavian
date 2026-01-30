import CustomError from "../../helpers/CustomError";
import { ICreateCategory } from "./category.interface";
import { CategoryModel } from "./category.models";


// Find user using case-insensitive regex
const createCategory = async (data: ICreateCategory) => {
    const category = await CategoryModel.create(data);
    if(!category) throw new CustomError(400, "Category not created");
    return category;
};

export const categoryService = {
    createCategory,
};