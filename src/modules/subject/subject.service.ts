import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import CustomError from "../../helpers/CustomError";
import { paginationHelper } from "../../utils/pagination";
import { ICreateSubject, IUpdateSubject } from "./subject.interface";
import { SubjectModel } from "./subject.models";


// create category
const createSubject = async (data: ICreateSubject, images: any) => {

    const subject = await SubjectModel.create(data);
    if (!subject) throw new CustomError(400, "Subject not created");

    if (images) {
        const uploadedImage = await uploadCloudinary(images?.path);
        if (uploadedImage) {
            subject.image = uploadedImage;
            await subject.save();
        }
    }
    return subject;
};

//get all categories
const getAllSubject = async ({
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

    const subjects = await SubjectModel.find(filter)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate("labelsId");

    if (!subjects.length) {
        throw new CustomError(404, "Subjects not found");
    }

    // Correct count
    const totalItems = await SubjectModel.countDocuments(filter);

    return {
        subjects,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            totalItems,
            totalPages: Math.ceil(totalItems / pagination.limit),
        },
    };
};


//get single category
const getSingleSubject = async (categoryId: string) => {
    const subject = await SubjectModel.findOne({ _id: categoryId, isDeleted: false, status: "active" }).populate("labelsId");
    if (!subject) throw new CustomError(400, "Subject not found");
    return subject;
}


//update category
const updateSubject = async (categoryId: string, data: IUpdateSubject, images: any) => {
    const subject = await SubjectModel.findOneAndUpdate({ _id: categoryId }, data, { new: true });
    if (!subject) throw new CustomError(400, "Subject not found");

    //if images
    if (images.path) {
        //delete previous image
        if (subject?.image?.public_id) {
            await deleteCloudinary(subject?.image?.public_id);
        }
        //upload new image && save
        const uploadedImage = await uploadCloudinary(images?.path);
        if (uploadedImage) {
            subject.image = uploadedImage;
            await subject.save();
        }
    }
    return subject;
}

//delete category
const deleteSubject = async (categoryId: string) => {
    const subject = await SubjectModel.findOneAndUpdate({ _id: categoryId, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!subject) throw new CustomError(400, "Subject not found");

    //delete previous image
    // if (category?.image?.public_id) {
    //     await deleteCloudinary(category?.image?.public_id);
    // }

    return subject;
}

export const subjectService = {
    createSubject,
    getAllSubject,
    getSingleSubject,
    updateSubject,
    deleteSubject
}