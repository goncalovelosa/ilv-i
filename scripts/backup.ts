import { network } from 'hardhat'
import { getTokenContract } from './utils/getContract'
import { getWallets } from './utils/signer'

async function main() {
  const ILVIToken = getTokenContract()

  const accounts = await getWallets(network.name)
  const account = accounts.compromised
  const { backup } = accounts

  console.log(
    `Set backup account on network: ${network.name} from address ${account.address} with backup as ${backup.address}`,
  )
  const backupTx = await ILVIToken.connect(account).registerEmergencyBackupAddress(backup.address)
  const receipt = await backupTx.wait(1)

  console.log(
    `Set backup account from address ${account.address} with backup as ${backup.address} with tx hash ${receipt.transactionHash}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
