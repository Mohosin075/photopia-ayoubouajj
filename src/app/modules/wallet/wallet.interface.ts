import { Document, Model, Types } from 'mongoose'

export interface IWallet extends Document {
  userId: Types.ObjectId
  balance: number
  totalEarnings: number
  totalWithdrawn: number
  currency: string
}

export type WalletModel = Model<IWallet>
