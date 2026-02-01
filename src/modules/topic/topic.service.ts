import mongoose from "mongoose";
import { TopicModel } from "./topic.models";
import { ICreateTopic } from "./topic.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";
import { LabelModel } from "../label/label.models";
import { paginationHelper } from "../../utils/pagination";


//create topic
const createTopic = async (data: ICreateTopic, image?: Express.Multer.File) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create the topic
    const topicDocs = await TopicModel.create([data], { session });
    const topic = topicDocs[0];

    if (!topic) {
      throw new CustomError(400, "Topic not created");
    }

    // Push topicId into label
    const label = await LabelModel.findByIdAndUpdate(
      topic.labelId,
      { $push: { topicsId: topic._id } },
      { new: true, session }
    );

    if (!label) {
      throw new CustomError(400, "Label not found");
    }

    // Save image info
    if (image?.path) {
      const uploaded = await uploadCloudinary(image.path);

      if (!uploaded) {
        throw new CustomError(400, "Image upload failed");
      }

      topic.image = uploaded;
      await topic.save({ session });
    }

    // Commit DB transaction
    await session.commitTransaction();
    session.endSession();

    return topic;
  } catch (error) {
    // Rollback DB changes
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

//get all topics
const getAllTopic = async ({
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

  const topics = await TopicModel.find(filter)
    .skip(pagination.skip)
    .limit(pagination.limit).sort(sort);
  if (!topics) {
    throw new CustomError(400, "Topics not found");
  }

  //corrrect pagination
  const count = await TopicModel.countDocuments(filter);
  const totalPages = Math.ceil(count / pagination.limit);

  return {
    topics,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalItems: count,
      totalPages
    },
  };
}

//get single topic
const getTopicById = async (topicId: string) => {
  const topic = await TopicModel.findById(topicId).populate({
    path: "articlesId",
    select: "name slug image _id status",
    match: { status: "active" },
  }).populate({
    path: "quizsId",
    select: "name slug image _id status",
    match: { status: "active" },
  }).populate({
    path: "flashcardsId",
    select: "name slug image _id status",
    match: { status: "active" },
  });

  if (!topic) throw new CustomError(400, "Topic not found");
  return topic;
}


export const topicService = { createTopic, getAllTopic, getTopicById };
