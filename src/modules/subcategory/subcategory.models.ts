import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import CustomError from "../../helpers/CustomError";
import { ISubCategory } from "./subcategory.interface";
import { CategoryModel } from "../subject/subject.models";



const subcategorySchema = new Schema<ISubCategory>({
  title: { type: String, required: true },
  description: { type: String },
  image: {
    public_id: { type: String },
    secure_url: { type: String },
  },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  topicsId: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
  status: { type: String, default: "active" },
  isDeleted: { type: Boolean, default: false },
  slug: { type: String },
}, { timestamps: true });

// Generate slug before save
subcategorySchema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const category = await SubCategoryModel.findOne({ title: this.title });
  if (category) {
    throw new CustomError(400, "SubCategory already exist");
  }

  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
subcategorySchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;
  const category = await SubCategoryModel.findOne({ title: update.title });
  if (category) {
    throw new CustomError(400, "SubCategory already exist");
  }
  if (update?.title) {
    update.slug = slugify(update.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
});

//pre middleware check categotyId exist or not
subcategorySchema.pre("save", async function (next) {
  const category = await CategoryModel.findById(this.categoryId);
  if (!category) {
    throw new CustomError(400, "Category not found");
  }
});

//pre middleware check categotyId exist or not
subcategorySchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;
  const category = await CategoryModel.findById(update.categoryId);
  if (!category) {
    throw new CustomError(400, "Category not found");
  }
});


export const SubCategoryModel = mongoose.model<ISubCategory>("SubCategory", subcategorySchema);
