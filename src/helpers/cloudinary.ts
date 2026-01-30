import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import CustomError from "./CustomError";
import config from "../config";

//Cloudinary Config

cloudinary.config({
  cloud_name: config.cloudinary.cloudName as string,
  api_key: config.cloudinary.apiKey as string,
  api_secret: config.cloudinary.apiSecret as string,
});

// Types
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

//Upload to Cloudinary =

export const uploadCloudinary = async (
  filePath: string
): Promise<CloudinaryUploadResult> => {
  try {
    if (!filePath || !fs.existsSync(filePath as string)) {
      throw new CustomError(400, "Image path missing");
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
      quality: "auto",
    });

    // Remove local file after successful upload
    fs.unlinkSync(filePath);

    return {
      public_id: cloudinaryResponse.public_id,
      secure_url: cloudinaryResponse.secure_url,
    };
  } catch (error: any) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw new CustomError(
      500,
      `Failed to upload image: ${error?.message ?? "Unknown error"}`
    );
  }
};

// Delete from Cloudinary

export const deleteCloudinary = async (publicId: string): Promise<unknown> => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    throw new CustomError(
      500,
      `Failed to delete image from Cloudinary: ${
        error?.message ?? "Unknown error"
      }`
    );
  }
};
