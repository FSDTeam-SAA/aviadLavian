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
  const flashcard = await FlashcardModel.findOne({ _id: id, isActive: true });
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

  // Search filter
  if (topicId) {
    const regex = new RegExp(topicId, "i");
    match.$or = [
      { question: regex },
      { topicId: { $in: [regex] } },
    ];
  }

  const sortObj: any = sort === "accending" ? { createdAt: 1 } : { createdAt: -1 };

  // Aggregation pipeline with $facet for pagination + total
  const pipeline: any[] = [
    { $match: match },
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
                    { $eq: ["$userId", new Types.ObjectId(userId)] }
                  ]
                }
              }
            },
            { $project: { flashcardId: 1, nextReviewAt: 1 } }
          ],
          as: "progress"
        }
      },
      {
        $addFields: { progress: { $arrayElemAt: ["$progress", 0] } }
      },
      {
        $match: {
          $or: [
            { "progress.nextReviewAt": { $lte: now } },
            { "progress": { $eq: null } }
          ]
        }
      }
    );
  }

  // Facet for total + paginated results
  pipeline.push({
    $facet: {
      meta: [{ $count: "total" }],
      data: [
        { $sort: sortObj },
        { $skip: skip },
        { $limit: pageLimit }
      ]
    }
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
  const updateQuery: any = {};


  // Normal field updates
  if (data.question) updateQuery.question = data.question;
  if (data.answer) updateQuery.answer = data.answer;
  if (data.difficulty) updateQuery.difficulty = data.difficulty;
  if (data.isActive !== undefined && data.isActive) {
    updateQuery.isActive = data.isActive === "true" ? true : false;
  }


  // Add topicId (no duplicates)
  if (data.addTopicId?.length) {
    updateQuery.$addToSet = {
      topicId: { $each: data.addTopicId },
    };
  }

  // Remove topicId
  if (data.removeTopicId?.length) {
    updateQuery.$pull = {
      topicId: { $in: data.removeTopicId },
    };
  }

  // Update document
  const flashcard = await FlashcardModel.findByIdAndUpdate(
    id,
    updateQuery,
    { new: true }
  );

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


export const flashcardService = { createFlashcard, getSingleFlashcard, getAllFlashcards, updateFlashcard, deleteFlashcard };
