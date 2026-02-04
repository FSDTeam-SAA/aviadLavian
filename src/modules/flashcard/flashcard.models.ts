import mongoose, { Schema } from "mongoose";
    import slugify from "slugify";
    import CustomError from "../../helpers/CustomError";
import { IFlashcard } from "./flashcard.interface";

//TODO: customize as needed

const flashcardSchema = new Schema<IFlashcard>({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: "active" },
  isDeleted: { type: Boolean, default: false },
  slug: { type: String },
}, { timestamps: true });

// Generate slug before save
flashcardSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const category = await FlashcardModel.findOne({ title: this.title });
  if (category) {
    throw new CustomError(400, "Flashcard already exist");
  }

  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
flashcardSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await FlashcardModel.findOne({ title: update.title });
  if (category) {
    throw new CustomError(400, "Flashcard already exist");
  }

  if (update?.title) {
    update.slug = slugify(update.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

});

export const FlashcardModel = mongoose.model<IFlashcard>("Flashcard", flashcardSchema);
