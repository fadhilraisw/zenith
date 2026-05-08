import mongoose, { Schema, model, models } from 'mongoose';

const AnalysisSchema = new Schema({
  userId: { type: String, required: true },
  reportMarkdown: { type: String, required: true },
  timeframe: { type: String, default: "MONTHLY" },
  netWorthUSD: { type: Number, default: 0 },
  incomeUSD: { type: Number, default: 0 },
  expenseUSD: { type: Number, default: 0 },
}, { timestamps: true });

export default models.Analysis || model('Analysis', AnalysisSchema);