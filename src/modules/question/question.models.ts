import mongoose, { Schema } from "mongoose";
    import slugify from "slugify";
    import CustomError from "../../helpers/CustomError";
import { IQuestion } from "./question.interface";

//TODO: customize as needed

const questionSchema = new Schema<IQuestion>({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: "active" },
  isDeleted: { type: Boolean, default: false },
  slug: { type: String },
}, { timestamps: true });

// Generate slug before save
questionSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const category = await QuestionModel.findOne({ title: this.title });
  if (category) {
    throw new CustomError(400, "Question already exist");
  }

  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
questionSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await QuestionModel.findOne({ title: update.title });
  if (category) {
    throw new CustomError(400, "Question already exist");
  }

  if (update?.title) {
    update.slug = slugify(update.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

});

export const QuestionModel = mongoose.model<IQuestion>("Question", questionSchema);
