import { ERC20Backup__factory } from './../../typechain-types/factories/contracts/ERC20Backup__factory'
import { ERC20Backup } from './../../typechain-types/contracts/ERC20Backup'
import { ethers } from 'hardhat'

function getTokenContract(address?: string): ERC20Backup {
  const contractAddress = address ?? process.env.DEPLOYED_TOKEN_ADDRESS
  if (!contractAddress) {
    throw new Error('DEPLOYED_TOKEN_ADDRESS is not set')
  }
  return ERC20Backup__factory.connect(contractAddress, ethers.provider)
}

export { getTokenContract }
