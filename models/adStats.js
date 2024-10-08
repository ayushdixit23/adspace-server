import mongoose from "mongoose";

const AdStatsSchema = new mongoose.Schema(
  {
    adId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Ad' },
    date: { type: Date, required: true },
    impressions: [
      {
        location: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    clicks: [
      {
        location: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    costPerClick: { type: Number, default: 0 },
    amountSpent: { type: Number, default: 0 },
    views: [
      { 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    engagement: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AdStatsSchema.index({ adId: 1, date: 1 });

export default mongoose.model("AdStats", AdStatsSchema);
