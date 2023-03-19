# Introduction

This is a Solidity smart contract called ILVIToken that implements the IILVIToken interface. It is used to manage the ILVIToken ERC20 token, which has the ability to mint and burn tokens, set backup addresses for token holders, permit token transfers, blacklist addresses, and as a safe measure if one has lose access to it's private keys, if previously registered a backup address it can transfer the tokens to that address paying the cost of the transfer on the destination account..

## Contract Overview

The ILVIToken contract inherits from three other contracts: ERC20, ERC20Permit, and Ownable. It also includes two mappings: backupAddresses and blacklist. These mappings are used to keep track of backup addresses for token holders and blacklisted addresses, respectively.

### Functions

The ILVIToken contract includes several functions that can be called by various parties. Here is a brief overview of each function:

`mint`: This function is used to mint new tokens and can only be called by the owner of the contract.
`burn`: This function is used to burn existing tokens and can only be called by the owner of the contract.
`setBackupAddress`: This function is used to set the backup address for a token holder. The token holder can set their own backup address, but cannot set it to their own address. This function can only be called by non-blacklisted addresses.
` permit``: This function is used to approve token transfers and can be called by anyone. However, if the owner or spender address is blacklisted, the transfer will fail.
 `emergencyTransfer`: This function is used to transfer tokens in case of an emergency, such as if a token holder loses access to their account. The tokens are transferred to the backup address, and the original address is blacklisted, ill address this one in further detail in the EIP712 and Emergency Transfer section.
`blacklistAddress`: This function is used to blacklist an address and can only be called by the owner of the contract.
`isBlacklisted`: This function is used to check if an address is blacklisted.
`getBackupAddress`: This function is used to get the backup address for a token holder.

### Events

The ILVIToken contract also includes several events that are emitted during certain actions. Here is a brief overview of each event:

`BackupAddressSet`: This event is emitted when a backup address is set for a token holder.
`BlacklistedAddressAdded`: This event is emitted when an address is added to the blacklist.

## Dependencies

The ILVIToken contract depends on the ERC20 and ERC20Permit contracts from the OpenZeppelin library, as well as the Ownable contract from Solidity's standard library.

## EIP712 and Emergency Transfer

The `EmergencyTransfer` function in this code uses the EIP712 standard to sign and verify transactions. EIP712 is a standard for typed data hashing and signing, which is used to authenticate messages and transactions on the Ethereum blockchain.

The EIP712 standard defines a way to encode structured data and hash it in a way that is resistant to certain types of attacks. This standard provides a way to securely sign and verify data, without revealing the private key used for signing.

In the `EmergencyTransfer` function, EIP712 is used to ensure that only authorized users can initiate an emergency transfer of funds. The function transfers the total balance from the caller account into it's registered backup address. The nonce value is used to prevent replay attacks, where an attacker intercepts and re-submits a valid signed transaction.

The `EmergencyTransfer` function then uses the EIP712 standard to sign the transaction data, using the private key of the authorized user. The signed transaction data is then sent to the contract, which verifies the signature using the EIP712 standard. If the signature is valid, the contract executes the emergency transfer.

Overall, the use of the EIP712 standard provides a secure and reliable way to authenticate transactions and prevent unauthorized access to the funds in the contract.

For more information on the EIP712 standard, please refer to the Ethereum Improvement Proposal [EIP-712](https://eips.ethereum.org/EIPS/eip-712).

# Usage

### Before using the contract, you need to set the following environment variables:

ALCHEMY_KEY: your Alchemy API key
BLACKLISTED_ACCOUNT_DEPLOYED_ADDRESS: the address of the BlacklistedAccount contract
OWNER_ACCOUNT: the address of the owner account
COMPROMISED_ACCOUNT: the address of the compromised account
BACKUP_ACCOUNT: the address of the backup account
NO_ETH_ACCOUNT: the address of an account with no ETH balance, can be used to test the emergency transfer function if the compromised account has no ETH balance

License
This contract is licensed under the MIT License.
