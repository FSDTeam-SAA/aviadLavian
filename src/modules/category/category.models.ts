import mongoose, { Schema, Model } from "mongoose";
import slugify from "slugify";
import { ICategory } from "./category.interface";

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
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

/// 🔹 Generate slug before save
categorySchema.pre("save", function (next) {
  if (!this.isModified("name")) return;

  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
    trim: true,
  });
});

/// 🔹 Generate slug on update
categorySchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() as any;

  if (update?.name) {
    update.slug = slugify(update.name, {
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
