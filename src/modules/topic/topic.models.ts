import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import CustomError from "../../helpers/CustomError";
import { ITopic } from "./topic.interface";
import { SubjectModel } from "../subject/subject.models";
import { LabelModel } from "../label/label.models";

const topicSchema = new Schema<ITopic>({
  title: { type: String, required: true },
  description: { type: String },
  labelId: { type: mongoose.Schema.Types.ObjectId, ref: "Label" },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  articlesId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
  quizsId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
  flashcardsId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Flashcard" }],
  image: {
    public_id: { type: String },
    secure_url: { type: String },
  },
  status: { type: String, default: "active" },
  isDeleted: { type: Boolean, default: false },
  slug: { type: String },
}, { timestamps: true });

// Generate slug before save
topicSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const category = await TopicModel.findOne({ title: this.title });
  if (category) {
    throw new CustomError(400, "Topic already exist");
  }

  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
topicSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await TopicModel.findOne({ title: update.title });
  if (category) {
    throw new CustomError(400, "Topic already exist");
  }

  if (update?.title) {
    update.slug = slugify(update.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
});

//pre middleware for check labelId exist or not in save
topicSchema.pre("save", async function (next) {
  const label = await LabelModel.findById(this.labelId);
  if (!label) {
    throw new CustomError(400, "Label not found");
  }
  //save subjectId
  this.subjectId = (label as any).subjectId as mongoose.Types.ObjectId;
})

//pre middleware for check subjectId exist or not in save
topicSchema.pre("save", async function (next) {
  const subject = await SubjectModel.findById(this.subjectId);
  if (!subject) {
    throw new CustomError(400, "Subject not found");
  }
});



export const TopicModel = mongoose.model<ITopic>("Topic", topicSchema);
