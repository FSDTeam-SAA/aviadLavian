import { uploadCloudinary } from "../../helpers/cloudinary";
import CustomError from "../../helpers/CustomError";
import { ICreateCategory } from "./category.interface";
import { CategoryModel } from "./category.models";


// create category
const createCategory = async (data: ICreateCategory, images: any) => {

    const category = await CategoryModel.create(data);
    if (!category) throw new CustomError(400, "Category not created");


    if (images) {
        const uploadedImage = await uploadCloudinary(images?.path);
        if (uploadedImage) {
            category.image = uploadedImage;
            await category.save();
        }
    }
    return category;
};

export const categoryService = {
    createCategory,
};