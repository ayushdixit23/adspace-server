import mongoose from "mongoose";

const InterestGroupSchema = new mongoose.Schema(
  {
    "Movies & Entertainment": { type: Number, default: 0 },
    News: { type: Number, default: 0 },
    Gaming: { type: Number, default: 0 },
    "Career & Education": { type: Number, default: 0 },
    "Anime & Manga": { type: Number, default: 0 },
    "Family & Relationships": { type: Number, default: 0 },
    Sports: { type: Number, default: 0 },
    "Science & Learning": { type: Number, default: 0 },
    "DIY & Crafts": { type: Number, default: 0 },
    "Music & Podcasts": { type: Number, default: 0 },
    "Beauty & Fashion": { type: Number, default: 0 },
    "Health & Fitness": { type: Number, default: 0 },
    "Food & Cooking": { type: Number, default: 0 },
    "Business & Finance": { type: Number, default: 0 },
    Photography: { type: Number, default: 0 },
    "Travel & Outdoors": { type: Number, default: 0 },
    "Art & Creativity": { type: Number, default: 0 },
    "Technology & Gadgets": { type: Number, default: 0 },
    "Pop Culture": { type: Number, default: 0 },
    Automotives: { type: Number, default: 0 },
    "Pets & Animals": { type: Number, default: 0 },
  },
  { _id: false }
);

const AgeGroupSchema = new mongoose.Schema(
  {
    "0-14": {
      count: { type: Number, default: 0 },
      interest: InterestGroupSchema,
    },
    "15-28": {
      count: { type: Number, default: 0 },
      interest: InterestGroupSchema,
    },
    "29-42": {
      count: { type: Number, default: 0 },
      interest: InterestGroupSchema,
    },
    "43-65": {
      count: { type: Number, default: 0 },
      interest: InterestGroupSchema,
    },
    "65+": {
      count: { type: Number, default: 0 },
      interest: InterestGroupSchema,
    },
  },
  { _id: false }
);

const LocationDataSchema = new mongoose.Schema(
  {
    userData: [
      {
        state: {
          name: { type: String },
          count: { type: Number, default: 0 },
          interest: InterestGroupSchema,
        },
        gender: {
          male: {
            interest: InterestGroupSchema,
            count: { type: Number, default: 0 },
            age: AgeGroupSchema,
          },
          female: {
            interest: InterestGroupSchema,
            count: { type: Number, default: 0 },
            age: AgeGroupSchema,
          },
        },
        age: AgeGroupSchema,
        userid: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("LocationData", LocationDataSchema);
