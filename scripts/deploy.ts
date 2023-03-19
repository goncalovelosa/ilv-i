import { ethers, network } from 'hardhat'
import { getWallets } from './utils/signer'

async function main() {
  const accounts = await getWallets(network.name)
  const deployer = accounts.owner

  console.log(`Deploying on network: ${network.name}`)
  console.log(`Deploying ILVIToken with account: ${deployer.address}`)

  const factory = await ethers.getContractFactory('ILVIToken')
  const ILVIToken = await factory.connect(deployer).deploy('ILVIToken', 'ILVI')
  const token = await ILVIToken.deployed()

  console.log(
    `ILVIToken has been deployed to ${
      ILVIToken.address
    } with token name ${await ILVIToken.name()} and symbol ${await ILVIToken.symbol()}`,
  )

  const relayFactory = await ethers.getContractFactory('ILVTokenRelay')
  const ILVTokenRelay = await relayFactory.connect(deployer).deploy(token.address)
  const relay = await ILVTokenRelay.deployed()

  console.log(`ILVTokenRelay has been deployed to ${ILVTokenRelay.address} with token address ${relay.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
