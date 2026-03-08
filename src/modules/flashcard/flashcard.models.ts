import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import CustomError from "../../helpers/CustomError";
import { IFlashcard } from "./flashcard.interface";

//TODO: customize as needed

const flashcardSchema = new Schema<IFlashcard>({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  image: {
    public_id: {
      type: String,
      required: false,
    },
    secure_url: {
      type: String,
      required: false,
    },
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Injury",
  },
  difficulty: {
    type: String,
    required: true,
    default: "medium",
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  }
}, { timestamps: true });



export const FlashcardModel = mongoose.model<IFlashcard>("Flashcard", flashcardSchema);
