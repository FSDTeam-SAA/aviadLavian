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
          { progress: null },
          { "progress.nextReviewAt": null },
          { "progress.nextReviewAt": { $lte: now } },
        ],
      },
    },
    {
      $lookup: {
        from: "injuries",
        let: { topicId: "$topicId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  "$_id",
                  {
                    $cond: [
                      { $eq: [{ $type: "$$topicId" }, "objectId"] },
                      "$$topicId",
                      { $toObjectId: "$$topicId" },
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              Id: 1,
              Name: 1,
              Primary_Body_Region: 1,
              Secondary_Body_Region: 1,
              Acuity: 1,
              Age_Group: 1,
              Tissue_Type: 1,
              Etiology_Mechanism: 1,
              Common_Sports: 1,
              Synonyms_Abbreviations: 1,
              Importance_Level: 1,
              Description: 1,
              Video_URL: 1,
              Tags_Keywords: 1,
            },
          },
        ],
        as: "topic",
      },
    },
    {
      $addFields: {
        topic: { $arrayElemAt: ["$topic", 0] },
      },
    },
    {
      $project: {
        _id: 1,
        question: 1,
        answer: 1,
        topicId: 1,
        topic: 1,
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

//!get all flashcards
const getAllFlashcards = async (
  {
    page,
    limit,
    sortBy = "assend",
    filterBytopicId = "",
    filterByAcuity = "",
    filterByAgeGroup = "",
    status = "active",
    search,
  }: GetAllFlashcardsParams,
  userId?: string,
  isAdmin: boolean = false
) => {
  // validate filterBytopicId
  if (filterBytopicId && !Types.ObjectId.isValid(filterBytopicId)) {
    throw new CustomError(400, "Invalid filterBytopicId, must be a valid ObjectId");
  }

  // validate sortBy
  const allowedSortValues = ["assend", "dessce"];
  if (sortBy && !allowedSortValues.includes(sortBy)) {
    throw new CustomError(
      400,
      `Invalid sortBy. Allowed values: ${allowedSortValues.join(", ")}`
    );
  }

  // validate status
  const allowedStatusValues = ["active", "inactive"];
  if (status && !allowedStatusValues.includes(status)) {
    throw new CustomError(
      400,
      `Invalid status. Allowed values: ${allowedStatusValues.join(", ")}`
    );
  }

  const { page: currentPage, limit: pageLimit, skip } = paginationHelper(
    page as string,
    limit as string
  );

  const now = new Date();
  const match: any = {};

  // status filter
  if (isAdmin) {
    if (status === "active") match.isActive = true;
    else if (status === "inactive") match.isActive = false;
  } else {
    match.isActive = true;
  }

  const sortObj = sortBy === "assend" ? { createdAt: 1 } : { createdAt: -1 };

  const pipeline: any[] = [
    { $match: match },

    {
      $lookup: {
        from: "injuries",
        let: {
          topicIdObj: {
            $switch: {
              branches: [
                {
                  case: { $eq: [{ $type: "$topicId" }, "objectId"] },
                  then: "$topicId",
                },
                {
                  case: {
                    $and: [
                      { $eq: [{ $type: "$topicId" }, "string"] },
                      {
                        $regexMatch: {
                          input: "$topicId",
                          regex: /^[a-fA-F0-9]{24}$/,
                        },
                      },
                    ],
                  },
                  then: { $toObjectId: "$topicId" },
                },
              ],
              default: null,
            },
          },
        },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$topicIdObj"] },
            },
          },
          {
            $project: {
              _id: 1,
              Id: 1,
              Name: 1,
              Primary_Body_Region: 1,
              Secondary_Body_Region: 1,
              Acuity: 1,
              Age_Group: 1,
              Tissue_Type: 1,
              Etiology_Mechanism: 1,
              Common_Sports: 1,
              Synonyms_Abbreviations: 1,
              Importance_Level: 1,
              Description: 1,
              Video_URL: 1,
              Tags_Keywords: 1,
            },
          },
        ],
        as: "topicId",
      },
    },
    {
      $addFields: {
        topicId: { $arrayElemAt: ["$topicId", 0] },
      },
    },
    {
      $match: {
        topicId: { $ne: null },
      },
    },
  ];

  // filter by populated topicId._id
  if (filterBytopicId) {
    pipeline.push({
      $match: {
        "topicId._id": new Types.ObjectId(filterBytopicId),
      },
    });
  }

  // filter by populated topicId.Acuity
  if (filterByAcuity?.trim()) {
    pipeline.push({
      $match: {
        "topicId.Acuity": {
          $regex: `^${filterByAcuity.trim()}$`,
          $options: "i",
        },
      },
    });
  }

  // filter by populated topicId.Age_Group
  if (filterByAgeGroup?.trim()) {
    pipeline.push({
      $match: {
        "topicId.Age_Group": {
          $regex: `^${filterByAgeGroup.trim()}$`,
          $options: "i",
        },
      },
    });
  }

  // search by flashcard fields + populated topic fields
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), "i");

    pipeline.push({
      $match: {
        $or: [
          { question: regex },
          { answer: regex },
          { "topicId.Id": regex },
          { "topicId.Name": regex },
          { "topicId.Primary_Body_Region": regex },
          { "topicId.Secondary_Body_Region": regex },
          { "topicId.Age_Group": regex },
          { "topicId.Tissue_Type": regex },
          { "topicId.Acuity": regex },
        ],
      },
    });
  }

  // only normal user can see own progress
  if (!isAdmin && userId) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new CustomError(400, "Invalid userId");
    }

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
            {
              $project: {
                _id: 1,
                flashcardId: 1,
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
            { progress: null },
            { "progress.nextReviewAt": null },
            { "progress.nextReviewAt": { $lte: now } },
          ],
        },
      }
    );
  }

  if (isAdmin) {
    pipeline.push({
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
      },
    });
  } else {
    pipeline.push({
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
        progress: 1,
        userAnswer: { $ifNull: ["$progress.userAnswer", ""] },
        lastReviewedAt: { $ifNull: ["$progress.lastReviewedAt", null] },
        nextReviewAt: { $ifNull: ["$progress.nextReviewAt", null] },
      },
    });
  }

  pipeline.push(
    { $sort: sortObj },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: pageLimit }],
        meta: [{ $count: "total" }],
      },
    },
    {
      $addFields: {
        meta: {
          page: currentPage,
          limit: pageLimit,
          total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
          pages: {
            $ceil: {
              $divide: [
                { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
                pageLimit,
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        data: 1,
        meta: 1,
      },
    }
  );

  const result = await FlashcardModel.aggregate(pipeline);

  return (
    result[0] || {
      meta: {
        page: currentPage,
        limit: pageLimit,
        total: 0,
        pages: 0,
      },
      data: [],
    }
  );
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
