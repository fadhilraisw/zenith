import mongoose, { Schema, model, models } from 'mongoose';

const TransactionSchema = new Schema({
  userId: { type: String, required: true },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  note: { type: String }
}, { timestamps: true });

export default models.Transaction || model('Transaction', TransactionSchema);