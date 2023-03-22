# ERC20Backup Smart Contract

This Solidity smart contract is named ERC20Backup and it implements the interface IERC20Backup. The contract inherits from several OpenZeppelin contracts including ERC20, ERC20Burnable, EIP712, and Ownable.

## Purpose

The **ERC20Backup** contract is designed to provide a backup functionality for the ERC20 token. In the event that the holder of the tokens loses access to their wallet, they can recover their tokens. If this emergency situation occurs, the owner can initiate an emergency transfer of their tokens to a registered backup address. This is accomplished through a signature that is verified by the contract.

## Methods

The ERC20Backup contract contains the following methods:

`function registerEmergencyBackupAddress(address backupAddress) external`

This function allows a token holder to register an emergency backup address. This address will be used in the event that the token holder loses access to their wallet. The backup address cannot be the same as the token holder's address, the contract address, or the zero address. Additionally, the backup address must not be blacklisted. Once registered, an event is emitted to notify the registered address.

`function emergencyTransfer(address signer, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external onlyOwner`

This function is used to initiate an emergency transfer of tokens from a token holder's address to their registered backup address. This function can only be called by the contract owner. The signature of the token holder is verified, and if valid, the tokens are transferred to the registered backup address. The token holder's address is then blacklisted to prevent further transfers.

`function isBlacklisted(address account) external view returns (bool)`

This function checks if an address has been blacklisted. A blacklisted address is unable to receive tokens.

`function mint(address to, uint256 amount) public override onlyOwner`

This function is used by the contract owner to mint new tokens. The tokens are minted to the specified address. If the address is blacklisted, the tokens are not minted.

`function nonces(address owner) public view virtual returns (uint256)`

This function returns the current nonce for a given address.

`function beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override`

This function is called before a token transfer occurs. It ensures that the recipient address is not blacklisted.

`function verifyTypedDataV4(address signer, bytes32 structHash, uint8 v, bytes32 r, bytes32 s) internal view returns (bool)`

This function verifies a typed data signature using EIP712.

`function useNonce(address owner) internal virtual returns (uint256 current)`

This function is used to increment the nonce for a given address. It returns the current nonce value.

### Events

The ILVIToken contract also includes several events that are emitted during certain actions. Here is a brief overview of each event:

- `EmergencyTransfer`: This event is emitted when an emergency transfer is initiated.
- `EmergencyBackupRegistered`: This event is emitted when a backup address is set for a token holder.
- `EmergencyTransferBlacklisted`: This event is emitted when an address is added to the blacklist.

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

`ALCHEMY_KEY`: your Alchemy API key

`COINMARKETCAP_API_KEY`: your CoinMarketCap API key (optional, used to estimate transaction fees)

`DEPLOYED_TOKEN_ADDRESS`: the address of the deployed token contract

`RELAY_ADDRESS`: the address of the ILVTokenRelay contract

`BLACKLISTED_ACCOUNT_DEPLOYED_TOKEN_ADDRESS`: the address of the BlacklistedAccount contract

`OWNER_ACCOUNT`: the address of the owner account

`COMPROMISED_ACCOUNT`: the address of the compromised account

`BACKUP_ACCOUNT`: the address of the backup account

`NO_ETH_ACCOUNT`: the address of an account with no ETH balance, can be used to test the emergency transfer
function if the compromised account has no ETH balance

### To get started, run the following commands:

- `npm install` to install the dependencies
- `npm run compile` to compile the contracts and generate the artifacts also generates the typechain files
- `npm run test` to run the tests (optional)

### To deploy the contract, run the following command:

**note** :remember to set/update the environment variables before running this command

- `npm run deploy:goerli` to deploy the contract to the Goerli testnet and output the contract addresses
- 'npm run mint:goerli' to mint tokens to an account
- `npm run backup:goerli` to set the backup address for the an account
- `npm run blacklist:goerli` to blacklist an account
- `npm run isBlacklisted:goerli` to check if an account is blacklisted
- `npm run emergencyTransfer:goerli` to execute an emergency transfer, outputting offline signature data and the transaction hash

**Note**: Please update the scripts accounts (manually for now) to use accordingly, and in the case of the `emergencyTransfer` also update the offline signing details.

Also included some adicional scripts measure contract size:

- `npm run size` to measure the contract size

### Deployed Contracts Addresses

- ILVIToken: [0x58506c80f9aa03a9e22bAa2020365244Eee0837C](https://goerli.etherscan.io/address/0x58506c80f9aa03a9e22baa2020365244eee0837c)
- ILVTokenRelay: [0x9E4aed0edb0dBBDb67BA0A5a5eD572EbC8f7f950](https://goerli.etherscan.io/address/0x9e4aed0edb0dbbdb67ba0a5a5ed572ebc8f7f950)

### Example of a successful emergency transfer

**Owner minting tokens** (10000000000000000000000) to [Compromised Account](https://goerli.etherscan.io/address/0x822ca42a8b7B911bA6c882aF4eEC1F2cf89fA5Ea) tx hash:
[0xf31415453f39f6330da4b1f74406580c084e994dba14d84cab26f0bf95383d40](https://goerli.etherscan.io/tx/0xf31415453f39f6330da4b1f74406580c084e994dba14d84cab26f0bf95383d40)

**Compromised Account** setting backup Address
tx hash: [0x23bf3bfcae6bc35f4331c179f1c4047e735d1521fbf8b60bb8e0c146960e6223](https://goerli.etherscan.io/tx/0x23bf3bfcae6bc35f4331c179f1c4047e735d1521fbf8b60bb8e0c146960e6223)
backup account: [0x3B64D381e61203E35bedC603A1639a6BD5d4ab7D](https://goerli.etherscan.io/address/0x3B64D381e61203E35bedC603A1639a6BD5d4ab7D)

**Force depleting eth** from `Compromised account` tx hash: [0xaef6ad6230694b7fe62b8bde820f4ce241fcb3dda77534425895886f5698871e](https://goerli.etherscan.io/tx/0xaef6ad6230694b7fe62b8bde820f4ce241fcb3dda77534425895886f5698871e)

**Using emergency transfer as owner** to transfer using the offline signature from the compromised account to send funds to `Backup account` tx hash:
[0xb3bfce4b505072f57f1393ecba36f73f2bb7028eedfe2dbf03bebc7fbe1c2cac](https://goerli.etherscan.io/tx/0xb3bfce4b505072f57f1393ecba36f73f2bb7028eedfe2dbf03bebc7fbe1c2cac)

### Used Accounts

- Owner Account: [0x0af0EC253AEDd2d298010Fd65B8Ed79b5b9481CE](https://goerli.etherscan.io/address/0x0af0EC253AEDd2d298010Fd65B8Ed79b5b9481CE)

- Compromised Account: [0x822ca42a8b7B911bA6c882aF4eEC1F2cf89fA5Ea](https://goerli.etherscan.io/address/0x822ca42a8b7B911bA6c882aF4eEC1F2cf89fA5Ea)

- Backup Account (registered for the compromised account): [0x3B64D381e61203E35bedC603A1639a6BD5d4ab7D](https://goerli.etherscan.io/address/0x3B64D381e61203E35bedC603A1639a6BD5d4ab7D)

- Blacklisted Account: [0x822ca42a8b7B911bA6c882aF4eEC1F2cf89fA5Ea](https://goerli.etherscan.io/address/0x822ca42a8b7B911bA6c882aF4eEC1F2cf89fA5Ea)

License
This contract is licensed under the MIT License.
