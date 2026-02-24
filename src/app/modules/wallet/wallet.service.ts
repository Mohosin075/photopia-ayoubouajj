import { Wallet } from './wallet.model'
import { IWallet } from './wallet.interface'
import { Types } from 'mongoose'

const getWalletByUserId = async (userId: string): Promise<IWallet | null> => {
  let wallet = await Wallet.findOne({ userId })
  if (!wallet) {
    wallet = await Wallet.create({ userId })
  }
  return wallet
}

const addEarnings = async (
  userId: string | Types.ObjectId,
  amount: number,
  session?: any
): Promise<IWallet> => {
  let wallet = await Wallet.findOne({ userId }).session(session)
  if (!wallet) {
    wallet = new Wallet({ userId })
  }

  wallet.balance += amount
  wallet.totalEarnings += amount
  
  await wallet.save({ session })
  return wallet
}

const deductBalance = async (
  userId: string | Types.ObjectId,
  amount: number,
  session?: any
): Promise<IWallet> => {
  const wallet = await Wallet.findOne({ userId }).session(session)
  if (!wallet || wallet.balance < amount) {
    throw new Error('Insufficient balance in wallet')
  }

  wallet.balance -= amount
  wallet.totalWithdrawn += amount
  
  await wallet.save({ session })
  return wallet
}

export const WalletService = {
  getWalletByUserId,
  addEarnings,
  deductBalance
}
