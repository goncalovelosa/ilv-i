import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Wallet } from 'ethers'
import { ethers } from 'hardhat'

enum accountTypes {
  'owner',
  'compromised',
  'backup',
  'blacklisted',
}

type AccountsType = Record<keyof typeof accountTypes, Wallet | SignerWithAddress>

async function getWallets(networkName: string): Promise<AccountsType> {
  const accounts = await ethers.getSigners()
  let wallets: AccountsType

  if (networkName.includes('goerli') || networkName.includes('sepolia')) {
    wallets = {
      owner: new Wallet(process.env.OWNER_ACCOUNT as string, ethers.provider),
      compromised: new Wallet(process.env.COMPROMISED_ACCOUNT as string, ethers.provider),
      backup: new Wallet(process.env.BACKUP_ACCOUNT as string, ethers.provider),
      blacklisted: new Wallet(process.env.BLACKLISTED_ACCOUNT as string, ethers.provider),
    }
  } else {
    wallets = {
      owner: accounts[0],
      compromised: accounts[1],
      backup: accounts[2],
      blacklisted: accounts[3],
    }
  }

  return wallets
}

export { getWallets, AccountsType }
