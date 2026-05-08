// File: /lib/models/Budget.ts
import mongoose, { Schema, model, models } from 'mongoose';

const BudgetSchema = new Schema({
  userId: { type: String, required: true },
  category: { type: String, required: true },
  period: { type: String, enum: ['WEEKLY', 'MONTHLY', 'YEARLY'], required: true },
  targetAmount: { type: Number, required: true, min: 0 },
  isCurrentlyActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

const Budget = models.Budget || model('Budget', BudgetSchema);
export default Budget;