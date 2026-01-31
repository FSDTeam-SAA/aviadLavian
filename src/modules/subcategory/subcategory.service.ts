import { SubCategoryModel } from "./subcategory.models";
import { ICreateSubCategory } from "./subcategory.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";


//create subcategory
const createSubCategory = async (data: ICreateSubCategory, images: Express.Multer.File | undefined) => {
  const subCategorie = await SubCategoryModel.create(data);
  if (!subCategorie) throw new CustomError(400, "SubCategory not created");

  //if images
  if (images) {
    const uploadedImage = await uploadCloudinary(images?.path);
    if (uploadedImage) {
      subCategorie.image = uploadedImage;
      await subCategorie.save();
    }
  }
  return subCategorie;
};

export const subcategoryService = { createSubCategory };
