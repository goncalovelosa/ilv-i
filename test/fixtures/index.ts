import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, Wallet } from 'ethers'
import { BigNumberish, constants, Signature } from 'ethers'
import { ERC20Backup } from '../../typechain-types'

async function getEmergencyTransferSignature(
  wallet: SignerWithAddress | Wallet,
  version: string,
  token: ERC20Backup,
  amount: BigNumberish = constants.MaxUint256,
  deadline = constants.MaxUint256,
): Promise<Signature> {
  const [nonce, name, chainId] = await Promise.all([token.nonces(wallet.address), token.name(), wallet.getChainId()])

  return ethers.utils.splitSignature(
    await wallet._signTypedData(
      {
        name,
        version,
        chainId,
        verifyingContract: token.address,
      },
      {
        EmergencyTransfer: [
          {
            name: 'owner',
            type: 'address',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint256',
          },
          {
            name: 'nonce',
            type: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      },
      {
        owner: wallet.address,
        spender: token.address,
        amount,
        nonce,
        deadline,
      },
    ),
  )
}

export { getEmergencyTransferSignature }
