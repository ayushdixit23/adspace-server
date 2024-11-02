import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const ApprovalsScehma = new mongoose.Schema(
  {
    id: { type: String }, type: { type: String },
    status: {
      type: String, default: "pending",
      enum: ["pending", "approved", "rejected"]
    },
    bank: {
      bankname: { type: String },
      personname: { type: String },
      branchname: { type: String },
      accountno: { type: String },
      IFSCcode: {
        type: String,
      },
    },
    text: { type: String },
    reapplydate: { type: Date }
  },

  { timestamps: true }
);

const Approvals= mongoose.model("Approvals", ApprovalsScehma);

export default Approvals