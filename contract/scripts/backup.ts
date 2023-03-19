import { network } from 'hardhat'
import { getContract } from './utils/getContract'
import { getWallets } from './utils/signer'

async function main() {
  const ILVIToken = getContract()

  const accounts = await getWallets(network.name)

  console.log(
    `Set backup account on network: ${network.name} from address ${accounts.compromised.address} with backup as ${accounts.backup.address}`,
  )
  const backupTx = await ILVIToken.connect(accounts.compromised).setBackupAddress(accounts.backup.address)
  const receipt = await backupTx.wait(2)

  console.log(
    `Set backup account from address ${accounts.compromised.address} with backup as ${accounts.backup.address} with tx hash ${receipt.transactionHash}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
