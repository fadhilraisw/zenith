import mongoose from "mongoose";

const MilestoneSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, default: "" },
  timeframe: { type: String, default: "30" },
  condition: { type: String, default: "<=" }, // WAJIB ADA AGAR RULE TIDAK KOSONG
  targetValue: { type: Number, required: true },
  deadline: { type: Date, default: null }, // WAJIB ADA UNTUK BATAS WAKTU
  xpReward: { type: Number, default: 0 },
  penalty: { type: Number, default: 0 },
  isQuest: { type: Boolean, default: true },
  isCompleted: { type: Boolean, default: false } // WAJIB ADA AGAR BISA DI-CLAIM
}, { timestamps: true });

export default mongoose.models.Milestone || mongoose.model("Milestone", MilestoneSchema);