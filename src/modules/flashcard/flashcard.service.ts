import { FlashcardModel } from "./flashcard.models";
import { GetAllFlashcardsParams, ICreateFlashcard } from "./flashcard.interface";
import CustomError from "../../helpers/CustomError";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";
import { Types } from "mongoose";

const createFlashcard = async (data: ICreateFlashcard, image?: Express.Multer.File) => {

  //now create flashcard
  const flashcard = await FlashcardModel.create(data);
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

//get single flashcard
const getSingleFlashcard = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new CustomError(400, "Invalid flashcard id");
  }

  const result = await FlashcardModel.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(id),
        isActive: true,
      },
    },

    // ✅ Populate topicId (stored as string[] of Injury _id)
    {
      $lookup: {
        from: "injuries",
        let: {
          topicIds: {
            $map: {
              input: "$topicId",
              as: "t",
              in: { $toObjectId: "$$t" }, // convert string -> ObjectId
            },
          },
        },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$topicIds"] },
            },
          },
          {
            $project: {
              __v: 0,
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
        as: "topicId",
      },
    },
  ]);

  const flashcard = result?.[0];
  if (!flashcard) throw new CustomError(404, "Flashcard not found");

  return flashcard;
};

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

  // Search filter
  if (topicId) {
    // if topicId is a valid ObjectId string -> filter by topicId array
    if (Types.ObjectId.isValid(topicId)) {
      match.topicId = { $in: [topicId] }; // topicId stored as string[] of injury _id
    } else {
      // otherwise keep your text search behavior on question
      const regex = new RegExp(topicId, "i");
      match.question = regex;
    }
  }

  const sortObj: any = sort === "accending" ? { createdAt: 1 } : { createdAt: -1 };

  const pipeline: any[] = [
    { $match: match },

    // ✅ Populate topicId (string[] of Injury _id) -> topicId (Injury[])
    {
      $lookup: {
        from: "injuries",
        let: {
          topicIds: {
            $map: {
              input: "$topicId",
              as: "t",
              in: { $toObjectId: "$$t" }, // convert string -> ObjectId
            },
          },
        },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$topicIds"] },
            },
          },
          {
            $project: {
              __v: 0,
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
        as: "topicId",
      },
    },
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
      {
        $addFields: { progress: { $arrayElemAt: ["$progress", 0] } },
      },
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

  // Add topicId (no duplicates)
  if (Array.isArray(data.addTopicId) && data.addTopicId.length > 0) {
    updateQuery.$addToSet = {
      ...(updateQuery.$addToSet || {}),
      topicId: { $each: data.addTopicId },
    };
  }

  // Remove topicId
  if (Array.isArray(data.removeTopicId) && data.removeTopicId.length > 0) {
    updateQuery.$pull = {
      ...(updateQuery.$pull || {}),
      topicId: { $in: data.removeTopicId },
    };
  }

  // Update + ✅ populate topicId
  const flashcard = await FlashcardModel.findByIdAndUpdate(id, updateQuery, {
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
  }

  // (optional) if image was saved after, re-populate again to ensure response is populated
  const populated = await FlashcardModel.findById(flashcard._id).populate({
    path: "topicId",
    model: "Injury",
    select: "-__v -createdAt -updatedAt",
  });

  return populated;
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


export const flashcardService = { createFlashcard, getSingleFlashcard, getAllFlashcards, updateFlashcard, deleteFlashcard };
