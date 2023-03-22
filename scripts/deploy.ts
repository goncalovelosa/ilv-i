import { ethers, network } from 'hardhat'
import { getWallets } from './utils/signer'

async function main() {
  const accounts = await getWallets(network.name)
  const deployer = accounts.owner

  console.log(`Deploying on network: ${network.name}`)
  console.log(`Deploying ERC20Backup with account: ${deployer.address}`)

  const factory = await ethers.getContractFactory('ERC20Backup')
  const ERC20Backup = await factory.connect(deployer).deploy('ILVIToken', 'ILVI', '1')

  console.log(
    `ERC20Backup has been deployed to ${
      ERC20Backup.address
    } with token name ${await ERC20Backup.name()} and symbol ${await ERC20Backup.symbol()}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
