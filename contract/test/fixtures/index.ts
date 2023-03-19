import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'ethers'
import { BigNumberish, constants, Signature } from 'ethers'
import { ILVIToken } from '../../typechain-types'

export async function getPermitSignature(
  wallet: SignerWithAddress,
  token: ILVIToken,
  spender: string,
  value: BigNumberish = constants.MaxUint256,
  deadline = constants.MaxUint256,
): Promise<Signature> {
  const [nonce, name, version, chainId] = await Promise.all([
    token.nonces(wallet.address),
    token.name(),
    '1',
    wallet.getChainId(),
  ])

  return ethers.utils.splitSignature(
    await wallet._signTypedData(
      {
        name,
        version,
        chainId,
        verifyingContract: token.address,
      },
      {
        Permit: [
          {
            name: 'owner',
            type: 'address',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'value',
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
        spender,
        value,
        nonce,
        deadline,
      },
    ),
  )
}
