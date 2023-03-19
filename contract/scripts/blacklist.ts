import { network } from 'hardhat'
import { getContract } from './utils/getContract'
import { getWallets } from './utils/signer'

async function main() {
  const ILVIToken = getContract()

  const accounts = await getWallets(network.name)

  console.log(`Blacklisting on network: ${network.name} blacklisting address ${accounts.blacklisted.address}`)
  const blacklistTx = await ILVIToken.connect(accounts.owner).blacklistAddress(accounts.blacklisted.address)
  const receipt = await blacklistTx.wait(2)

  console.log(`Blacklisted address ${accounts.blacklisted.address} with tx hash ${receipt.transactionHash}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
