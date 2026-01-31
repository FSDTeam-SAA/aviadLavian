import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import CustomError from "../../helpers/CustomError";
import { paginationHelper } from "../../utils/pagination";
import { ICreateCategory, IUpdateCategory } from "./category.interface";
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

//get all categories
const getAllCategories = async ({
    page = 1,
    limit = 10,
    search,
    status = "all",
}: any) => {

    // Pagination (always defined)
    const pagination = paginationHelper(page, limit);

    // Base filter
    const filter: any = {
        isDeleted: false,
    };

    // Status filter
    if (status !== "all") {
        if (status !== "active" && status !== "inactive") throw new CustomError(400, "Invalid status, available status: active, inactive");
        filter.status = status;
    }

    // Search filter
    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }

    const categories = await CategoryModel.find(filter)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate("subCategoriesId");

    if (!categories.length) {
        throw new CustomError(404, "Categories not found");
    }

    // Correct count
    const totalItems = await CategoryModel.countDocuments(filter);

    return {
        categories,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            totalItems,
            totalPages: Math.ceil(totalItems / pagination.limit),
        },
    };
};


//get single category
const getSingleCategory = async (categoryId: string) => {
    const category = await CategoryModel.findById({ _id: categoryId, isDeleted: false, status: "active" }).populate("subCategoriesId");
    if (!category) throw new CustomError(400, "Category not found");
    return category;
}


//update category
const updateCategory = async (categoryId: string, data: IUpdateCategory, images: any) => {
    const category = await CategoryModel.findOneAndUpdate({ _id: categoryId }, data, { new: true });
    if (!category) throw new CustomError(400, "Category not found");

    //if images
    if (images.path) {
        //delete previous image
        if (category?.image?.public_id) {
            await deleteCloudinary(category?.image?.public_id);
        }
        //upload new image && save
        const uploadedImage = await uploadCloudinary(images?.path);
        if (uploadedImage) {
            category.image = uploadedImage;
            await category.save();
        }
    }
    return category;
}


export const categoryService = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory
};