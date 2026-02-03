import mongoose from "mongoose";
import { TopicModel } from "./topic.models";
import { ICreateTopic } from "./topic.interface";
import CustomError from "../../helpers/CustomError";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
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
  if (topics.length === 0) {
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
  const topic = await TopicModel.findById(topicId)
  // .populate({
  //   path: "articlesId",
  //   select: "name slug image _id status",
  //   match: { status: "active" },
  // }).populate({
  //   path: "quizsId",
  //   select: "name slug image _id status",
  //   match: { status: "active" },
  // }).populate({
  //   path: "flashcardsId",
  //   select: "name slug image _id status",
  //   match: { status: "active" },
  // });

  if (!topic) throw new CustomError(400, "Topic not found");
  return topic;
}

//update topic
const updateTopic = async (topicId: string, data: any, image?: Express.Multer.File) => {
  const topic = await TopicModel.findByIdAndUpdate(topicId, data, { new: true });
  if (!topic) throw new CustomError(400, "Topic not found");

  //update image into cloudinary
  if (image?.path) {
    //delete image from cloudinary
    if (topic.image?.public_id) {
      await deleteCloudinary(topic?.image?.public_id);
    }

    const uploaded = await uploadCloudinary(image.path);
    if (!uploaded) {
      throw new CustomError(400, "Image upload failed");
    }
    topic.image = uploaded;
    await topic.save();
  }
  return topic;
}

//delete topic
const deleteTopic = async (topicId: string) => {

  const topic = await TopicModel.findOneAndDelete({
    _id: topicId,
    $and: [
      {
        $or: [
          { articlesId: { $exists: false } },
          { articlesId: { $size: 0 } },
        ],
      },
      {
        $or: [
          { quizsId: { $exists: false } },
          { quizsId: { $size: 0 } },
        ],
      },
      {
        $or: [
          { flashcardsId: { $exists: false } },
          { flashcardsId: { $size: 0 } },
        ],
      },
    ],
  });

  if (
    (topic as any)?.articlesId?.length > 0 ||
    (topic as any)?.quizsId?.length > 0 ||
    (topic as any)?.flashcardsId?.length > 0
  ) {
    throw new CustomError(
      400,
      "Topic has associated content, cannot delete"
    );
  }

  if (!topic) {
    throw new CustomError(400, "Topic not found");
  }

  // delete image from Cloudinary
  if (topic?.image?.public_id) {
    await deleteCloudinary(topic.image.public_id);
  }

  return topic;
};



export const topicService = { createTopic, getAllTopic, getTopicById, updateTopic, deleteTopic };
