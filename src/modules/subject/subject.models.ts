import mongoose, { Schema, Model } from "mongoose";
import slugify from "slugify";
import { ISubject } from "./subject.interface";
import CustomError from "../../helpers/CustomError";

const subjectSchema = new Schema<ISubject>(
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
    labelsId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Label",
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
subjectSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const category = await SubjectModel.findOne({ title: this.title });
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
subjectSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await SubjectModel.findOne({ title: update.title });
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

export const SubjectModel: Model<ISubject> = mongoose.model<ISubject>(
  "Subject",
  subjectSchema
);
