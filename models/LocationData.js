import mongoose from "mongoose";

const AgeGroupSchema = new mongoose.Schema(
  {
    "0-14": { type: Number, default: 0 },
    "15-28": { type: Number, default: 0 },
    "29-42": { type: Number, default: 0 },
    "43-65": { type: Number, default: 0 },
    "65+": { type: Number, default: 0 },
  },
  { _id: false }
);

const LocationDataSchema = new mongoose.Schema(
  {
    userData: [{
        state: { name: { type: String }, count: { type: Number, default: 0 } },
        gender: {
          male: {
            count: { type: Number, default: 0 },
            age: AgeGroupSchema,
          },
          female: {
            count: { type: Number, default: 0 },
            age: AgeGroupSchema,
          },
        },
        age: AgeGroupSchema,
        userid:[{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
      }],
  },
  { timestamps: true }
);

export default mongoose.model("LocationData", LocationDataSchema);
