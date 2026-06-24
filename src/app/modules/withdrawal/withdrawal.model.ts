import { Schema, model } from 'mongoose'
import { IWithdrawal, WithdrawalModel } from './withdrawal.interface'

const withdrawalSchema = new Schema<IWithdrawal, WithdrawalModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'EUR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    bankAccountDetails: {
      accountHolderName: String,
      bankName: String,
      iban: String,
      swiftCode: String,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: Date,
    transactionId: String,
  },
  {
    timestamps: true,
  },
)

export const Withdrawal = model<IWithdrawal, WithdrawalModel>(
  'Withdrawal',
  withdrawalSchema,
)
