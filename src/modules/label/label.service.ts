import mongoose from "mongoose";
import { LabelModel } from "./label.models";
import { ICreateLabel, IUpdateLabel } from "./label.interface";
import CustomError from "../../helpers/CustomError";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";
import { SubjectModel } from "../subject/subject.models";


//create subcategory
const createLabel = async (
  data: ICreateLabel,
  images?: Express.Multer.File
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create label
    const label = await LabelModel.create([data], { session });
    if (!label[0]) {
      throw new CustomError(400, "Label not created");
    }

    const createdLabel = label[0];

    // Push label id into subject
    const subject = await SubjectModel.findByIdAndUpdate(
      createdLabel.subjectId,
      { $push: { labelsId: createdLabel._id } },
      { session }
    );

    if (!subject) {
      throw new CustomError(400, "Subject not found");
    }

    // Upload image (outside DB but still controlled)
    if (images) {
      const uploadedImage = await uploadCloudinary(images.path);

      if (!uploadedImage) {
        throw new CustomError(400, "Image upload failed");
      }

      createdLabel.image = uploadedImage;
      await createdLabel.save({ session });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return createdLabel;

  } catch (error) {
    // Rollback everything
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


//get label by labelId
const getLabelById = async (labelId: string) => {
  console.log(labelId);
  const label = await LabelModel.findById(labelId);
  if (!label) throw new CustomError(400, "label not found");
  return label;
};

//get all labels
const getAllLabel = async ({
  page = 1,
  limit = 10,
  search,
  sortBy,
  status = "all",
}: any) => {
  // Pagination 
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

  // check sort allow
  if (sortBy !== "accending" && sortBy !== "decending") {
    throw new CustomError(400, "Invalid sortBy, available sortBy: accending, decending");
  }

  //sort
  let sort = { createdAt: -1 };
  if (status === "active") {
    sort = { createdAt: -1 };
  } else if (status === "inactive") {
    sort = { createdAt: 1 };
  }

  const labels = await LabelModel.find(filter)
    .skip(pagination.skip)
    .limit(pagination.limit)
    .sort({ createdAt: -1 });
  if (labels.length === 0) throw new CustomError(400, "labels not found");

  const total = await LabelModel.countDocuments(filter);

  return {
    labels,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalItems: total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

//update label
const updateLabel = async (labelId: string, data: IUpdateLabel, images: any) => {
  const label = await LabelModel.findByIdAndUpdate(labelId, data, { new: true });
  if (!label) throw new CustomError(400, "label not found");

  //if images
  if (images?.path) {
    //delete previous image
    if (label?.image?.public_id) {
      await deleteCloudinary(label?.image?.public_id);
    }
    //upload new image && save
    const uploadedImage = await uploadCloudinary(images?.path);
    if (uploadedImage) {
      label.image = uploadedImage;
      await label.save();
    }
  }
  return label;
};

//delete label
const deleteLabel = async (labelId: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the label first
    const label = await LabelModel.findById(labelId).session(session);

    if (!label) {
      throw new CustomError(400, "Label not found");
    }

    // Prevent delete if topics exist
    if (label.topicsId && label.topicsId.length > 0) {
      throw new CustomError(
        400,
        "Label has topics associated with it, cannot delete"
      );
    }

    // Delete label
    await LabelModel.deleteOne({ _id: labelId }).session(session);

    // Remove labelId from subject
    await SubjectModel.findByIdAndUpdate(
      label.subjectId,
      { $pull: { labelsId: labelId } },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Delete image from Cloudinary
    if (label.image?.public_id) {
      try {
        await deleteCloudinary(label.image.public_id);
      } catch (err) {
        console.error("Cloudinary delete failed", err);
      }
    }

    return label;
  } catch (error) {
    // Rollback DB
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};





export const LabelService = { createLabel, getLabelById, getAllLabel, updateLabel, deleteLabel };