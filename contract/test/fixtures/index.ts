import { ILVIToken } from '../../typechain-types/contracts/ILVIToken'

export async function permitRequest(
  token: ILVIToken,
  owner: string,
  spender: string,
  chainId: number,
  value: number,
  nonce: number,
  deadline: number,
) {
  const domainName = token.name
  const domainVersion = '1'
  const contractAddress = token.address

  const domain = {
    name: domainName,
    version: domainVersion,
    verifyingContract: contractAddress,
    chainId,
  }

  const domainType = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ]

  const message = { owner, spender, value, nonce, deadline }
  const Permit = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ]

  const dataToSign = JSON.stringify({
    types: {
      EIP712Domain: domainType,
      Permit: Permit,
    },
    domain,
    primaryType: 'Permit',
    message,
  })

  return dataToSign
}

export function splitSignature(signature: string): { r: string; s: string; v: number } {
  const r = signature.slice(0, 66)
  const s = '0x' + signature.slice(66, 130)
  const v = parseInt(signature.slice(130, 132), 16)

  return { r, s, v }
}
