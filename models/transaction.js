import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const AdTransactionsSchema = new mongoose.Schema(
  {
    transactionid: { type: String, unique: true },
    amount: { type: Number },
    advertiserid: { type: ObjectId, ref: "Advertiser" },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "failed", "processing"],
    },
    type: { type: String },
  },
  { timestamps: true }
);

AdTransactionsSchema.index({ title: "text" });

export default mongoose.model("AdTransactions", AdTransactionsSchema);
