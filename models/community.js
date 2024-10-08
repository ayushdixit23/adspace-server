import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const communitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  creator: { type: ObjectId, ref: "User", required: true },
  popularity: { type: Number },
  category: { type: String, required: true },
  dp: { type: String, required: true },
  members: [
    {
      type: ObjectId,
      ref: "User",
    },
  ],
  memberscount: { type: Number, default: 0 },
  posts: [
    {
      type: ObjectId,
      ref: "Post",
    },
  ],
  totalposts: { type: Number, default: 0 },
  tags: { type: [String] },
  desc: { type: String },
  preview: { type: [String] },
  topics: [{ type: ObjectId, ref: "Topic" }],
  totaltopics: { type: Number, default: 2 },
  type: { type: String, default: "public" },
  isverified: { type: Boolean, default: false },
  status: {
    type: String,
    default: "Unblock",
    enum: ["Unblock", "Block"],
  },
  blocked: [
    {
      type: ObjectId,
      ref: "User",
    },
  ],
  moderators: [
    {
      type: ObjectId,
      ref: "User",
      // required: true
    },
  ],
  ismonetized: { type: Boolean, default: false },
  notifications: [
    {
      id: { type: ObjectId, ref: "User" },
      muted: { type: Boolean, default: false },
    },
  ],
  admins: [
    {
      type: ObjectId,
      ref: "User",
      //  required: true
    },
  ],
});

communitySchema.index({ title: "text" });

export default mongoose.model("Community", communitySchema)