import { Document, Model, Types } from 'mongoose'

export interface IWithdrawal extends Document {
  userId: Types.ObjectId
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  bankAccountDetails?: {
    accountHolderName: string
    bankName: string
    iban: string
    swiftCode?: string
  }
  requestedAt: Date
  processedAt?: Date
  transactionId?: string
}

export type WithdrawalModel = Model<IWithdrawal>
