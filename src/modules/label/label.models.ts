import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import CustomError from "../../helpers/CustomError";
import { ILabel } from "./label.interface";
import { SubjectModel } from "../subject/subject.models";



const labelSchema = new Schema<ILabel>({
  title: { type: String, required: true },
  description: { type: String },
  image: {
    public_id: { type: String },
    secure_url: { type: String },
  },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  topicsId: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
  status: { type: String, default: "active" },
  isDeleted: { type: Boolean, default: false },
  slug: { type: String },
}, { timestamps: true });

// Generate slug before save
labelSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const category = await LabelModel.findOne({ title: this.title });
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
labelSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;
  const category = await LabelModel.findOne({ title: update.title });
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

//pre middleware check subjectId exist or not in save
labelSchema.pre("save", async function (next) {
  const subject = await SubjectModel.findById(this.subjectId);
  if (!subject) {
    throw new CustomError(400, "Subject not found");
  }
});

//pre middleware check categotyId exist or not in update
labelSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;
  const subject = await SubjectModel.findById(update.subjectId);
  if (!subject) {
    throw new CustomError(400, "Subject not found");
  }
});


export const LabelModel = mongoose.model<ILabel>("Label", labelSchema);
