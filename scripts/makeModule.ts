// scripts/makeModule.ts

import fs from "fs";
import path from "path";

// Get module name from terminal argument
const moduleName = process.argv[2];

if (!moduleName) {
    console.error("❌ Please provide a module name. Example: npm run make:module category");
    process.exit(1);
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const Module = capitalize(moduleName);
const lowerModule = moduleName.toLowerCase();

// Base path
const basePath = path.join(process.cwd(), "src", "modules", lowerModule);
if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });

// ===== Interface =====
fs.writeFileSync(
    path.join(basePath, `${lowerModule}.interface.ts`),
    `
    //TODO: customize as needed
    
    export interface I${Module} {
  _id: string;
  title: string;
  description: string;
  status?: string;
  isDeleted?: boolean;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreate${Module} {
  title: string;
  description?: string;
  status?: string;
}
`
);

// ===== Validation =====
fs.writeFileSync(
    path.join(basePath, `${lowerModule}.validation.ts`),
    `import { z } from "zod";
//TODO: customize as needed
export const create${Module}Schema = z.object({
  title: z.string().min(3).max(50).transform(val => val.trim()),
  description: z.string().max(500).optional().transform(val => val?.trim()),
});
`
);

// ===== Model =====
fs.writeFileSync(
    path.join(basePath, `${lowerModule}.models.ts`),
    `import mongoose, { Schema } from "mongoose";
    import slugify from "slugify";
    import CustomError from "../../helpers/CustomError";
import { I${Module} } from "./${lowerModule}.interface";

//TODO: customize as needed

const ${lowerModule}Schema = new Schema<I${Module}>({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: "active" },
  isDeleted: { type: Boolean, default: false },
  slug: { type: String },
}, { timestamps: true });

// Generate slug before save
${lowerModule}Schema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const category = await ${Module}Model.findOne({ title: this.title });
  if (category) {
    throw new CustomError(400, "${Module} already exist");
  }

  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
${lowerModule}Schema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await ${Module}Model.findOne({ title: update.title });
  if (category) {
    throw new CustomError(400, "${Module} already exist");
  }

  if (update?.title) {
    update.slug = slugify(update.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

});

export const ${Module}Model = mongoose.model<I${Module}>("${Module}", ${lowerModule}Schema);
`
);

// ===== Service =====
fs.writeFileSync(
    path.join(basePath, `${lowerModule}.service.ts`),
    `import { ${Module}Model } from "./${lowerModule}.models";
import { ICreate${Module} } from "./${lowerModule}.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";

//TODO: customize as needed

const create${Module} = async (data: ICreate${Module}, image?: Express.Multer.File) => {
  const item = await ${Module}Model.create(data);
  if (!item) throw new CustomError(400, "${Module} not created");

  if (image) {
    const uploaded = await uploadCloudinary(image.path);
    if (uploaded) {
      item.image = uploaded;
      await item.save();
    }
  }

  return item;
};

export const ${lowerModule}Service = { create${Module} };
`
);

// ===== Controller =====
fs.writeFileSync(
    path.join(basePath, `${lowerModule}.controller.ts`),
    `import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreate${Module} } from "./${lowerModule}.interface";
import { ${lowerModule}Service } from "./${lowerModule}.service";

//TODO: customize as needed
export const create${Module} = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreate${Module} = req.body;
  const image = req.file as Express.Multer.File | undefined;
  const item = await ${lowerModule}Service.create${Module}(data, image);
  ApiResponse.sendSuccess(res, 200, "${Module} created", item);
});
`
);

// ===== Routes =====
fs.writeFileSync(
    path.join(basePath, `${lowerModule}.routes.ts`),
    `import express from "express";
import { create${Module} } from "./${lowerModule}.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { create${Module}Schema } from "./${lowerModule}.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

//router.post("/create-${lowerModule}", uploadSingle("image"), validateRequest(create${Module}Schema), create${Module});

export default router;
`
);
