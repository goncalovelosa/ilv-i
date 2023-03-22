import { ethers, network } from 'hardhat'
import { getTokenContract } from './utils/getContract'
import { getWallets } from './utils/signer'
async function main() {
  const ILVIToken = getTokenContract()

  const accounts = await getWallets(network.name)

  const destinationAddress = accounts.compromised.address
  const amount = 1000

  console.log(`Minting on network: ${network.name}`)
  console.log(`Minting ILVI to ${destinationAddress} with amount ${amount}`)

  const mintTx = await ILVIToken.connect(accounts.owner).mint(
    destinationAddress,
    ethers.utils.parseUnits(amount.toString()),
  )
  await mintTx.wait(2)
  console.log(`Minted ${amount} ILVI to ${destinationAddress}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
