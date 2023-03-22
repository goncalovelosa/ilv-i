// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./interfaces/IERC20Backup.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Backup is IERC20Backup, ERC20, ERC20Burnable, Ownable, EIP712 {
    using Counters for Counters.Counter;

    mapping(address => Counters.Counter) private _nonces;
    mapping(address => address) private _emergencyBackups;
    mapping(address => bool) private _blacklisted;

    bytes32 private immutable _emergencyTransferHash;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _version
    ) ERC20(_name, _symbol) EIP712(_name, _version) {
        _emergencyTransferHash = keccak256(
            "EmergencyTransfer(address owner,address spender,uint256 amount,uint256 nonce,uint256 deadline)"
        );
    }

    /**
     * @notice Registers a backup address for a given token holder.
     * @param backupAddress The address to be registered as the backup address for the token holder.
     */
    function registerEmergencyBackupAddress(address backupAddress) external {
        require(backupAddress != _msgSender(), "Backup address cannot be the same as the token holder");
        require(backupAddress != address(this), "Backup address cannot be the contract address");
        require(backupAddress != address(0), "Backup address cannot be the zero address");
        require(!_blacklisted[backupAddress], "Backup address is blacklisted");
        _emergencyBackups[_msgSender()] = backupAddress;
        emit EmergencyBackupRegistered(_msgSender(), backupAddress);
    }

    /**
     * @notice Verifies a signature for a given signer and transfers the accounts total tokens to the registered backup address.
     * @dev Only the owner can call this function.
     * @param signer The address of the token holder.
     * @param deadline The deadline for the transfer.
     * @param v The recovery byte of the signature.
     * @param r Half of the ECDSA signature pair.
     * @param s Half of the ECDSA signature pair.
     */
    function emergencyTransfer(address signer, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external onlyOwner {
        address receiver = _emergencyBackups[signer];
        require(!_blacklisted[signer], "Emergency backup address is blacklisted");
        require(deadline > block.timestamp, "Transfer deadline has passed");
        uint256 amount = balanceOf(signer);
        require(amount > 0, "No tokens to transfer");

        bytes32 structHash = keccak256(
            abi.encode(_emergencyTransferHash, signer, address(this), amount, _useNonce(signer), deadline)
        );

        require(_verifyTypedDataV4(signer, structHash, v, r, s), "Invalid signature");
        _approve(signer, address(this), amount);
        _transfer(signer, receiver, amount);
        emit EmergencyTransfer(signer, receiver, amount);
        _blacklisted[signer] = true;
        emit EmergencyTransferBlacklisted(signer);
    }

    /**
     * @notice Checks if an address is blacklisted.
     * @param account To check if blacklisted
     * @return true if blacklisted, false otherwise
     */
    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }

    /**
     * @notice Mints tokens.
     * @dev Only callable by the owner.
     * @param to destination address
     * @param amount amount to mint
     */
    function mint(address to, uint256 amount) public override onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Tracks the nonce of each token holder to prevent replay attacks.
     * @dev Prevents replay attacks by preventing the same signature from being more than once.
     * @param owner address of the owner
     */
    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner].current();
    }

    /**
     * @notice Executed before any token transfer.
     * @dev Checks if the recipient address is blacklisted
     * @param from Origin address of the transfer
     * @param to Destination address of the transfer
     * @param amount Amount of tokens to transfer
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!_blacklisted[to], "Recipient address is blacklisted");
    }

    /**
     * @notice Hashes the typed data according to EIP-712.
     * @param signer The address of the signer
     * @param structHash The hash of the struct
     * @param v The recovery byte of the signature.
     * @param r Half of the ECDSA signature pair.
     * @param s Half of the ECDSA signature pair.
     * @return true if the signature is valid, false otherwise
     */
    function _verifyTypedDataV4(
        address signer,
        bytes32 structHash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (bool) {
        bytes32 hash = _hashTypedDataV4(structHash);
        return ECDSA.recover(hash, v, r, s) == signer;
    }

    /**
     * @notice Increments the nonce of the owner and returns the current nonce.
     * @param owner address of the owner
     * @return current Signer current nonce
     */
    function _useNonce(address owner) internal virtual returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }
}
