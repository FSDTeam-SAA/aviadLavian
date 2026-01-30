import mongoose, { Schema, Model } from "mongoose";
import slugify from "slugify";
import { ICategory } from "./category.interface";
import CustomError from "../../helpers/CustomError";

const categorySchema = new Schema<ICategory>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    image: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    subCategoriesId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    slug: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before save
categorySchema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const category = await CategoryModel.findOne({ title: this.title });
  if (category) {
    throw new CustomError(400, "Category already exist");
  }

  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
categorySchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await CategoryModel.findOne({ title: update.title });
  if (category) {
    throw new CustomError(400, "Category already exist");
  }

  if (update?.title) {
    update.slug = slugify(update.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

});

export const CategoryModel: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  categorySchema
);
