import { ethers } from 'hardhat'
import { ILVIToken, ILVIToken__factory } from '../../typechain-types'

export function getContract(address?: string): ILVIToken {
  const contractAddress = address ?? process.env.DEPLOYED_ADDRESS
  if (!contractAddress) {
    throw new Error('DEPLOYED_ADDRESS is not set')
  }
  return ILVIToken__factory.connect(contractAddress, ethers.provider)
}
