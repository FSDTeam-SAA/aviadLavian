import mongoose, { Schema } from "mongoose";
import { IInjury } from "./injury.interface";

const injurySchema = new Schema<IInjury>(
  {
    // Unique Identifier
    Id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Name of the injury
    Name: {
      type: String,
      required: true,
      trim: true,
    },

    // Hierarchy Parent
    Primary_Body_Region: {
      type: String,
      required: true,
      trim: true,
    },

    // Clinical & Metadata Fields (Always kept, even if empty)
    Secondary_Body_Region: {
      type: String,
      default: "",
      trim: true,
    },

    Acuity: {
      type: String,
      default: "",
      trim: true,
    },

    Age_Group: {
      type: String,
      default: "",
      trim: true,
    },

    // Array fields - can contain multiple comma-separated values
    Tissue_Type: {
      type: [String],
      default: [],
    },

    Etiology_Mechanism: {
      type: String,
      default: "",
      trim: true,
    },

    // Array fields
    Common_Sports: {
      type: [String],
      default: [],
    },

    Synonyms_Abbreviations: {
      type: [String],
      default: [],
    },

    Importance_Level: {
      type: String,
      default: "",
      trim: true,
    },

    Description: {
      type: String,
      default: "",
      trim: true,
    },

    Video_URL: {
      type: String,
      default: "",
      trim: true,
    },

    Image_URL: {
      type: String,
      default: "",
      trim: true,
    },

    // Array field
    Tags_Keywords: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

// Index for faster searches
injurySchema.index({ Primary_Body_Region: 1 });
injurySchema.index({ Name: "text", Tags_Keywords: "text" });

export const InjuryModel = mongoose.model<IInjury>("Injury", injurySchema);
