import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Wallet } from 'ethers'
import { ethers } from 'hardhat'

enum accountTypes {
  'owner',
  'compromised',
  'backup',
  'blacklisted',
  'noEthAccount',
}

type AccountsType = Record<keyof typeof accountTypes, Wallet | SignerWithAddress>

async function getWallets(networkName: string): Promise<AccountsType> {
  const accounts = await ethers.getSigners()
  let wallets: AccountsType
  switch (networkName) {
    case 'goerli':
      wallets = {
        owner: new Wallet(process.env.OWNER_ACCOUNT as string, ethers.provider),
        compromised: new Wallet(process.env.COMPROMISED_ACCOUNT as string, ethers.provider),
        backup: new Wallet(process.env.BACKUP_ACCOUNT as string, ethers.provider),
        blacklisted: new Wallet(process.env.BLACKLISTED_ACCOUNT as string, ethers.provider),
        noEthAccount: new Wallet(process.env.NO_EHT_ACCOUNT as string, ethers.provider),
      }
      break
    default:
      wallets = {
        owner: accounts[0],
        compromised: accounts[1],
        backup: accounts[2],
        blacklisted: accounts[3],
        noEthAccount: accounts[4],
      }
      break
  }

  return wallets
}

export { getWallets, AccountsType }
