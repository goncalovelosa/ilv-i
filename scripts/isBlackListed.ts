import { network } from 'hardhat'
import { getTokenContract } from './utils/getContract'
import { getWallets } from './utils/signer'

async function main() {
  const ILVIToken = getTokenContract()

  const accounts = await getWallets(network.name)
  const account = accounts.compromised

  console.log(`Checking if address ${account.address} is blacklisted`)

  const isBlacklisted = await ILVIToken.isBlacklisted(account.address)

  console.log(`Address ${account.address} is blacklisted: ${isBlacklisted}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
