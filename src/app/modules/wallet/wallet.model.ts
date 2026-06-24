import { Schema, model } from 'mongoose'
import { IWallet, WalletModel } from './wallet.interface'

const walletSchema = new Schema<IWallet, WalletModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'EUR',
    },
  },
  {
    timestamps: true,
  },
)

export const Wallet = model<IWallet, WalletModel>('Wallet', walletSchema)
