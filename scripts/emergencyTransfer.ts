import { BigNumber } from 'ethers'
import { network } from 'hardhat'
import { getEmergencyTransferSignature } from '../test/fixtures'
import { getTokenContract } from './utils/getContract'
import { getWallets } from './utils/signer'

async function main() {
  const ILVIToken = getTokenContract()

  const accounts = await getWallets(network.name)
  const account = accounts.compromised
  const { backup } = accounts

  const balance = await ILVIToken.balanceOf(account.address)
  const balanceParsed = balance.toBigInt()

  console.log(
    `Emergency transfer on network: ${network.name} from address ${account.address} to ${backup.address} with amount ${balanceParsed}}`,
  )

  const deadLine = BigNumber.from(Math.floor(Date.now() / 1000) + 60 * 20)

  const signature = await getEmergencyTransferSignature(account, '1', ILVIToken, balance, deadLine)

  const { v, r, s } = signature

  // generate offline signature
  console.log(`balance: ${balanceParsed}`)
  console.log(`deadLine: ${deadLine}`)
  console.log(`v: ${v}`)
  console.log(`r: ${r}`)
  console.log(`s: ${s}`)

  const relayTx = await ILVIToken.connect(accounts.owner).emergencyTransfer(account.address, deadLine, v, r, s)
  const receipt = await relayTx.wait(2)

  console.log(
    `Emergency transfer from address ${account.address} to ${backup.address} with amount ${balanceParsed} with tx hash ${receipt.transactionHash}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
