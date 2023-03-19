import { ethers } from 'hardhat'
import { ILVIToken, ILVIToken__factory, ILVTokenRelay, ILVTokenRelay__factory } from '../../typechain-types'

function getTokenContract(address?: string): ILVIToken {
  const contractAddress = address ?? process.env.DEPLOYED_TOKEN_ADDRESS
  if (!contractAddress) {
    throw new Error('DEPLOYED_TOKEN_ADDRESS is not set')
  }
  return ILVIToken__factory.connect(contractAddress, ethers.provider)
}

function getRelayContract(address?: string): ILVTokenRelay {
  const contractAddress = address ?? process.env.RELAY_ADDRESS
  if (!contractAddress) {
    throw new Error('RELAY_ADDRESS is not set')
  }
  return ILVTokenRelay__factory.connect(contractAddress, ethers.provider)
}

export { getTokenContract, getRelayContract }
