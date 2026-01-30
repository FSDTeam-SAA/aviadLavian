import { QuestionModel } from "./question.models";
import { ICreateQuestion } from "./question.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";

//TODO: customize as needed

const createQuestion = async (data: ICreateQuestion, image?: Express.Multer.File) => {
  const item = await QuestionModel.create(data);
  if (!item) throw new CustomError(400, "Question not created");

  if (image) {
    const uploaded = await uploadCloudinary(image.path);
    if (uploaded) {
      item.image = uploaded;
      await item.save();
    }
  }

  return item;
};

export const questionService = { createQuestion };
