import { network } from 'hardhat'
import { getContract } from './utils/getContract'
import { getWallets } from './utils/signer'

async function main() {
  const ILVIToken = getContract()

  const accounts = await getWallets(network.name)

  console.log(`Checking if address ${accounts.blacklisted.address} is blacklisted`)

  const isBlacklisted = await ILVIToken.isBlacklisted(accounts.blacklisted.address)

  console.log(`Address ${accounts.blacklisted.address} is blacklisted: ${isBlacklisted}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
