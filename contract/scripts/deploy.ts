import { Wallet } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, network } from 'hardhat'

async function main() {
  let deployer: Wallet | SignerWithAddress
  const signers = await ethers.getSigners()
  switch (network.name) {
    case 'ganache':
      deployer = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', ethers.provider)
      break
    case 'goerli':
      deployer = new Wallet(process.env.PRIVATE_KEY_ACCOUNT_1 as string, ethers.provider)
      break
    default:
      deployer = signers[0]
  }

  console.log(`Deploying on network: ${network.name}`)
  console.log(`Deploying ILVIToken with account: ${deployer.address}`)

  const factory = await ethers.getContractFactory('ILVIToken')
  const ILVIToken = await factory.connect(deployer).deploy('ILVIToken', 'ILVI')

  await ILVIToken.deployed()

  console.log(
    `ILVIToken has been deployed to ${
      ILVIToken.address
    } with token name ${await ILVIToken.name()} and symbol ${await ILVIToken.symbol()}`,
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
