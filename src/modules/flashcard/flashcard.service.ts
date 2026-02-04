import { FlashcardModel } from "./flashcard.models";
import { GetAllFlashcardsParams, ICreateFlashcard } from "./flashcard.interface";
import CustomError from "../../helpers/CustomError";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";

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
const getAllFlashcards = async ({
  page,
  limit,
  sort = "accending",
  search,
  status = "active",
}: GetAllFlashcardsParams, isAdmin: boolean) => {

  // Pagination
  const { page: currentPage, limit: pageLimit, skip } = paginationHelper(page, limit);

  //status can only be active or inactive
  if (status !== "active" && status !== "inactive") {
    throw new CustomError(400, "Invalid status parameter, allowed values are 'active' and 'inactive'");
  }

  //allow only admin too se both inactive and active flashcards, but user can see only active flashcards
  let query: any = {};

  // Status filter logic
  if (isAdmin) {
    if (status === "active") query.isActive = true;
    else if (status === "inactive") query.isActive = false;
  } else {
    //users can only see active flashcards
    query.isActive = true;
  }

  //if search is provided
  if (search) {
    const regex = new RegExp(search, "i");
    query = {
      $or: [
        { question: regex },
        { topicId: { $in: [regex] } },
      ],
    };
  }


  //check if sort is accending or decending
  if (sort !== "accending" && sort !== "decending") {
    throw new CustomError(400, "Invalid sort parameter, allowed values are 'accending' and 'decending'");
  }
  // Build sort object
  let sortObj: any = sort == "accending" ? { createdAt: 1 } : { createdAt: -1 };

  // Fetch flashcards
  const flashcards = await FlashcardModel.find(query)
    .skip(skip)
    .limit(pageLimit)
    .sort(sortObj);

  //calculate total flashcards document
  const totalFlashcards = await FlashcardModel.countDocuments(query);
  let meta = {
    page: currentPage,
    limit: pageLimit,
    total: totalFlashcards,
    pages: Math.ceil(totalFlashcards / pageLimit),
  }

  if (!flashcards || flashcards.length === 0) {
    throw new CustomError(404, "Flashcards not found");
  }

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
