import { FlashcardModel } from "./flashcard.models";
import { GetAllFlashcardsParams, ICreateFlashcard } from "./flashcard.interface";
import CustomError from "../../helpers/CustomError";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";
import mongoose, { Types } from "mongoose";
import { FlashcardProgressModel } from "../flashcardprogress/flashcardprogress.models";

const createFlashcard = async (data: ICreateFlashcard, image?: Express.Multer.File) => {

  //now create flashcard
  const flashcard = (await FlashcardModel.create(data));
  if (!flashcard) throw new CustomError(400, "Flashcard not created");

  //now upload image
  if (image?.path) {
    const uploaded = await uploadCloudinary(image.path);
    if (uploaded) {
      flashcard.image = uploaded;
      await flashcard.save();
    }
  }

  return flashcard;
};

//get flashcard by injuryId also user progress

// const getFlashcardByInjuryId = async (injuryId: string, req: any) => {
//   const userId = req?.user?._id;
//   const { page: pageParam, limit: limitParam } = req.query;
//   const { page, limit, skip } = paginationHelper(pageParam, limitParam);

//   if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//     throw new CustomError(400, "Invalid userId");
//   }

//   const filter = {
//     topicId: injuryId,
//     isActive: true,
//   };

//   const totalData = await FlashcardModel.countDocuments(filter);

//   if (!totalData) {
//     throw new CustomError(404, "Flashcard not found");
//   }

//   const flashcards = await FlashcardModel.find(filter)
//     .skip(skip)
//     .limit(limit)
//     .lean();

//   const flashcardIds = flashcards.map((item) => item._id);

//   const progressList = await FlashcardProgressModel.find({
//     userId: new mongoose.Types.ObjectId(userId),
//     flashcardId: { $in: flashcardIds },
//   })
//     .select("flashcardId userAnswer")
//     .lean();

//   const progressMap = new Map(
//     progressList.map((item) => [String(item.flashcardId), item.userAnswer])
//   );

//   const result = flashcards.map((flashcard) => ({
//     ...flashcard,
//     userAnswer: progressMap.get(String(flashcard._id)) || "",
//   }));

//   return {
//     meta: {
//       page,
//       limit,
//       totalData,
//       totalPage: Math.ceil(totalData / limit),
//     },
//     data: result,
//   };
// };

const getFlashcardByInjuryId = async (injuryId: string, req: any) => {
  const userId = req?.user?._id;
  const { page: pageParam, limit: limitParam } = req.query;
  const { page, limit, skip } = paginationHelper(pageParam, limitParam);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new CustomError(400, "Invalid userId");
  }

  const now = new Date();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const matchTopicId = mongoose.Types.ObjectId.isValid(injuryId)
    ? new mongoose.Types.ObjectId(injuryId)
    : injuryId;

  const result = await FlashcardModel.aggregate([
    {
      $match: {
        topicId: matchTopicId,
        isActive: true,
      },
    },
    {
      $lookup: {
        from: "flashcardprogresses",
        let: { flashcardId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$flashcardId", "$$flashcardId"] },
                  { $eq: ["$userId", userObjectId] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              userAnswer: 1,
              lastReviewedAt: 1,
              nextReviewAt: 1,
              updatedAt: 1,
            },
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 1 },
        ],
        as: "progress",
      },
    },
    {
      $addFields: {
        progress: { $arrayElemAt: ["$progress", 0] },
      },
    },
    {
      $match: {
        $or: [
          // user never reviewed -> show
          { progress: null },

          // progress exists but nextReviewAt not set -> show
          { "progress.nextReviewAt": null },

          // review time reached -> show
          { "progress.nextReviewAt": { $lte: now } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        question: 1,
        answer: 1,
        topicId: 1,
        difficulty: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        __v: 1,
        userAnswer: { $ifNull: ["$progress.userAnswer", ""] },
        lastReviewedAt: { $ifNull: ["$progress.lastReviewedAt", null] },
        nextReviewAt: { $ifNull: ["$progress.nextReviewAt", null] },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        meta: [{ $count: "totalData" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
    {
      $addFields: {
        totalData: {
          $ifNull: [{ $arrayElemAt: ["$meta.totalData", 0] }, 0],
        },
      },
    },
    {
      $project: {
        data: 1,
        meta: {
          page: { $literal: page },
          limit: { $literal: limit },
          totalData: "$totalData",
          totalPage: {
            $ceil: {
              $divide: ["$totalData", limit],
            },
          },
        },
      },
    },
  ]);

  const finalResult = result[0] || {
    meta: {
      page,
      limit,
      totalData: 0,
      totalPage: 0,
    },
    data: [],
  };

  return finalResult;
};




//get single flashcard
const getSingleFlashcard = async (id: string) => {
  const flashcard = await FlashcardModel.findOne({ _id: id, isActive: true }).populate("topicId");
  if (!flashcard) throw new CustomError(404, "Flashcard not found");

  return flashcard;
}

//get all flashcards
const getAllFlashcards = async (
  { page, limit, sort = "accending", topicId, status = "active" }: GetAllFlashcardsParams,
  userId?: string,
  isAdmin: boolean = false
) => {
  const { page: currentPage, limit: pageLimit, skip } = paginationHelper(page, limit);
  const now = new Date();

  const match: any = {};

  // Status filter
  if (isAdmin) {
    if (status === "active") match.isActive = true;
    else if (status === "inactive") match.isActive = false;
  } else {
    match.isActive = true;
  }

  // Search filter (topicId is SINGLE ObjectId string now)
  if (topicId) {
    const regex = new RegExp(topicId, "i");
    match.$or = [
      { question: regex },
      { topicId: regex }, // ✅ topicId is string/ObjectId string, not array
    ];
  }

  const sortObj: any = sort === "accending" ? { createdAt: 1 } : { createdAt: -1 };

  const pipeline: any[] = [
    { $match: match },

    // ✅ Populate topicId (single) -> Injury object
    {
      $lookup: {
        from: "injuries",
        let: {
          topicIdObj: {
            $cond: [
              { $eq: [{ $type: "$topicId" }, "objectId"] },
              "$topicId",
              { $toObjectId: "$topicId" }, // if stored as string
            ],
          },
        },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$topicIdObj"] } } },
          { $project: { __v: 0, createdAt: 0, updatedAt: 0 } },
        ],
        as: "topicId",
      },
    },
    // topicId becomes single object instead of array
    { $addFields: { topicId: { $arrayElemAt: ["$topicId", 0] } } },
  ];

  if (userId) {
    pipeline.push(
      {
        $lookup: {
          from: "flashcardprogresses",
          let: { flashcardId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$flashcardId", "$$flashcardId"] },
                    { $eq: ["$userId", new Types.ObjectId(userId)] },
                  ],
                },
              },
            },
            { $project: { flashcardId: 1, nextReviewAt: 1 } },
          ],
          as: "progress",
        },
      },
      { $addFields: { progress: { $arrayElemAt: ["$progress", 0] } } },
      {
        $match: {
          $or: [{ "progress.nextReviewAt": { $lte: now } }, { progress: { $eq: null } }],
        },
      }
    );
  }

  pipeline.push({
    $facet: {
      meta: [{ $count: "total" }],
      data: [{ $sort: sortObj }, { $skip: skip }, { $limit: pageLimit }],
    },
  });

  const result = await FlashcardModel.aggregate(pipeline);

  if (!result || !result[0] || result[0].data.length === 0) {
    throw new CustomError(404, "Flashcards not found");
  }

  const flashcards = result[0].data;
  const totalFlashcards = result[0].meta[0]?.total || 0;

  const meta = {
    page: currentPage,
    limit: pageLimit,
    total: totalFlashcards,
    pages: Math.ceil(totalFlashcards / pageLimit),
  };

  return { flashcards, meta };
};



//update flashcard
const updateFlashcard = async (
  id: string,
  data: any,
  image?: Express.Multer.File
) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new CustomError(400, "Invalid flashcard id");
  }

  const updateQuery: any = {};

  // Normal field updates
  if (data.question !== undefined) updateQuery.question = data.question;
  if (data.answer !== undefined) updateQuery.answer = data.answer;
  if (data.difficulty !== undefined) updateQuery.difficulty = data.difficulty;

  // isActive ("true" | "false")
  if (data.isActive !== undefined) {
    updateQuery.isActive = data.isActive === "true";
  }

  // ✅ topicId is SINGLE now (replace it)
  // accept either `data.topicId` or your existing `data.addTopicId[0]`
  if (data.topicId) {
    if (!Types.ObjectId.isValid(data.topicId)) {
      throw new CustomError(400, "Invalid topicId");
    }
    updateQuery.topicId = data.topicId;
  } else if (Array.isArray(data.addTopicId) && data.addTopicId.length > 0) {
    const nextTopicId = data.addTopicId[0];
    if (!Types.ObjectId.isValid(nextTopicId)) {
      throw new CustomError(400, "Invalid addTopicId");
    }
    updateQuery.topicId = nextTopicId;
  }

  // If someone sends removeTopicId for single field, allow clearing (optional)
  if (Array.isArray(data.removeTopicId) && data.removeTopicId.length > 0) {
    // only clear if current topicId is in remove list
    updateQuery.topicId = null;
  }

  // Update + ✅ populate topicId
  let flashcard = await FlashcardModel.findByIdAndUpdate(id, updateQuery, {
    new: true,
  }).populate({
    path: "topicId",
    model: "Injury",
    select: "-__v -createdAt -updatedAt",
  });

  if (!flashcard) {
    throw new CustomError(404, "Flashcard not found");
  }

  // Image update (Cloudinary)
  if (image?.path) {
    if (flashcard.image?.public_id) {
      await deleteCloudinary(flashcard.image.public_id);
    }

    const uploaded = await uploadCloudinary(image.path);
    if (uploaded) {
      flashcard.image = uploaded;
      await flashcard.save();
    }

    // re-populate after save (because save returns doc without re-populate sometimes)
    flashcard = await FlashcardModel.findById(flashcard._id).populate({
      path: "topicId",
      model: "Injury",
      select: "-__v -createdAt -updatedAt",
    });
  }

  return flashcard;
};

//delete flashcard
const deleteFlashcard = async (id: string) => {
  const flashcard = await FlashcardModel.findByIdAndDelete(id);
  if (!flashcard) throw new CustomError(404, "Flashcard not found");
  //now delete image from cloudinary
  if (flashcard.image?.public_id) {
    await deleteCloudinary(flashcard.image.public_id);
  }

  return flashcard;
}


export const flashcardService = { createFlashcard, getFlashcardByInjuryId, getSingleFlashcard, getAllFlashcards, updateFlashcard, deleteFlashcard };
