import mongoose from "mongoose";
import { TopicModel } from "./topic.models";
import { ICreateTopic } from "./topic.interface";
import CustomError from "../../helpers/CustomError";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import { LabelModel } from "../label/label.models";
import { paginationHelper } from "../../utils/pagination";
import { SubjectModel } from "../subject/subject.models";


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
  label,
  subject,
  sortBy = "accending",
  status = "all",
}: any) => {

  const skip = (page - 1) * limit;

  // Base topic match
  const matchStage: any = {
    isDeleted: false,
  };

  if (status !== "all") {
    if (!["active", "inactive"].includes(status)) {
      throw new CustomError(400, "Invalid status");
    }
    matchStage.status = status;
  }

  if (search) {
    matchStage.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const sortStage =
    sortBy === "decending" ? { createdAt: -1 } : { createdAt: 1 };

  // Aggregation pipeline
  const pipeline: any[] = [
    { $match: matchStage },

    // label join
    {
      $lookup: {
        from: "labels",
        localField: "labelId",
        foreignField: "_id",
        as: "labelId",
      },
    },
    { $unwind: "$labelId" },

    // subject join
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "subjectId",
      },
    },
    { $unwind: "$subjectId" },
  ];

  // Label filter
  if (label) {
    pipeline.push({
      $match: {
        $or: [
          { "labelId.slug": { $regex: label, $options: "i" } },
          { "labelId.title": { $regex: label, $options: "i" } },
        ],
      },
    });
  }

  // Subject filter
  if (subject) {
    pipeline.push({
      $match: {
        $or: [
          { "subjectId.slug": { $regex: subject, $options: "i" } },
          { "subjectId.title": { $regex: subject, $options: "i" } },
        ],
      },
    });
  }

  // Pagination & sorting
  pipeline.push(
    { $sort: sortStage },
    { $skip: skip },
    { $limit: Number(limit) }
  );

  const topics = await TopicModel.aggregate(pipeline);

  // Count for pagination
  const countPipeline = pipeline.filter(
    stage =>
      !("$skip" in stage || "$limit" in stage || "$sort" in stage)
  );

  countPipeline.push({ $count: "total" });

  const countResult = await TopicModel.aggregate(countPipeline);
  const totalItems = countResult[0]?.total || 0;

  return {
    topics,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};


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
