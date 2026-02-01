import { LabelModel } from "./label.models";
import { ICreateLabel } from "./label.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";


//create subcategory
const createLabel = async (data: ICreateLabel, images: Express.Multer.File | undefined) => {
  const Label = await LabelModel.create(data);
  if (!Label) throw new CustomError(400, "label not created");

  //if images
  if (images) {
    const uploadedImage = await uploadCloudinary(images?.path);
    if (uploadedImage) {
      Label.image = uploadedImage;
      await Label.save();
    }
  }
  return Label;
};

export const LabelService = { createLabel };
