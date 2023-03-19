import { BigNumber } from 'ethers'
import { network } from 'hardhat'
import { getPermitSignature } from '../test/fixtures'
import { getRelayContract, getTokenContract } from './utils/getContract'
import { getWallets } from './utils/signer'

async function main() {
  const ILVIToken = getTokenContract()
  const ILVRelay = getRelayContract()

  const accounts = await getWallets(network.name)
  const account = accounts.compromised
  const backupAccount = await ILVIToken.getBackupAddress(account.address)

  const balance = await ILVIToken.balanceOf(account.address)
  const balanceParsed = balance.toBigInt()

  console.log(
    `Emergency transfer on network: ${network.name} from address ${account.address} to ${backupAccount} with amount ${balanceParsed}}`,
  )

  const deadLine = BigNumber.from(Math.floor(Date.now() / 1000) + 60 * 20)

  const signature = await getPermitSignature(account, ILVIToken, ILVRelay.address, balanceParsed, deadLine)
  const { v, r, s } = signature

  // generate offline signature
  console.log(`balance: ${balance}`)
  console.log(`deadLine: ${deadLine}`)
  console.log(`v: ${v}`)
  console.log(`r: ${r}`)
  console.log(`s: ${s}`)

  const relayTx = await ILVRelay.connect(accounts.owner).emergencyTransfer(account.address, balance, deadLine, v, r, s)
  const receipt = await relayTx.wait(2)

  console.log(
    `Emergency transfer from address ${account.address} to ${backupAccount} with amount ${balanceParsed} with tx hash ${receipt.transactionHash}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
