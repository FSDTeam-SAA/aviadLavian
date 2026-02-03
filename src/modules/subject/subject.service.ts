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
    sortBy = "accending",
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


    if (sortBy !== "accending" && sortBy !== "decending") {
        throw new CustomError(400, "Invalid sortBy, available sortBy: accending, decending");
    }
    let sort = {};
    // Sort filter
    if (sortBy === "accending") {
        sort = { createdAt: 1 };
    } else if (sortBy === "decending") {
        sort = { createdAt: -1 };
    }

    const subjects = await SubjectModel.find(filter)
        .skip(pagination.skip)
        .limit(pagination.limit).sort(sort);

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
    const subject = await SubjectModel.findOne({ _id: categoryId, isDeleted: false, status: "active" }).populate({
        path: "labelsId",
        select: "title slug image",
    });
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
const deleteSubject = async (subjectId: string) => {
    const subject = await SubjectModel.findById(subjectId);

    if (!subject) {
        throw new CustomError(400, "Subject not found");
    }

    // Check if it has associated labels
    if (subject?.labelsId?.length > 0) {
        throw new CustomError(400, "Subject has labels associated with it, cannot delete");
    }

    const deletedSubject = await SubjectModel.findByIdAndDelete(subjectId);
    if (!deletedSubject) throw new CustomError(400, "Subject not deleted");

    // Delete from Cloudinary if needed
    if (subject?.image?.public_id) {
        await deleteCloudinary(subject?.image?.public_id);
    }

    return subject;
};

export const subjectService = {
    createSubject,
    getAllSubject,
    getSingleSubject,
    updateSubject,
    deleteSubject
}