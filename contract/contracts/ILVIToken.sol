// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./interfaces/IILVIToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ILVIToken is IILVIToken, ERC20, Pausable, Ownable, EIP712 {
    mapping(address => address) public backupAddresses;
    mapping(address => bool) public blacklist;
    mapping(address => uint256) public nonces;

    bytes32 private constant RECOVERY_TRANSFER_TYPEHASH =
        keccak256(
            "EmergencyTransfer(address token,address from,address to,uint256 amount,uint256 nonce,uint256 deadline)"
        );

    constructor(string memory name, string memory symbol) ERC20(name, symbol) EIP712(name, "1") {}

    /****************************************/
    /*               Public                 */
    /****************************************/

    /**
     * @notice Pauses the contract.
     * @dev Only callable by the owner.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract.
     * @dev Only callable by the owner.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @notice Mints tokens.
     * @dev Only callable by the owner.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "ILVIToken: mint to the zero address");
        require(!blacklist[to], "ILVIToken: Recipient address is blacklisted.");
        _mint(to, amount);
    }

    /**
     * @notice Burns tokens.
     * @dev Only callable by the owner.
     * @param from The address to burn tokens from.
     * @param amount The amount of tokens to burn.
     */
    function burn(address from, uint256 amount) public override onlyOwner {
        _burn(from, amount);
    }

    /**
     * @notice sets the backup address for the sender.
     * @param backupAddress The address to set as the backup address.
     */
    function setBackupAddress(address backupAddress) public {
        require(backupAddress != address(0), "ILVIToken: backup address is the zero address");
        require(backupAddress != msg.sender, "ILVIToken: backup address is the same as the sender");
        require(!blacklist[msg.sender], "ILVIToken: your account is blacklisted");
        require(!blacklist[backupAddress], "ILVIToken: backup address is blacklisted");
        require(
            backupAddresses[msg.sender] != backupAddress,
            "ILVIToken: backup address is already set to that same address"
        );
        backupAddresses[msg.sender] = backupAddress;
        emit BackupAddressSet(msg.sender, backupAddress);
    }

    /**
     * @notice recovers tokens from caller to it's backup address.
     * @param nonce The nonce of the recovery.
     * @param signature The signature of the recovery.
     */
    function emergencyTransfer(uint256 nonce, uint256 deadline, bytes calldata signature) public {
        require(nonce == nonces[msg.sender], "ILVIToken: invalid nonce");
        require(block.timestamp <= deadline, "Signature expired");

        uint256 amount = balanceOf(msg.sender);
        require(amount > 0, "ILVIToken: no tokens to recover");

        bytes32 structHash = keccak256(
            abi.encode(
                RECOVERY_TRANSFER_TYPEHASH,
                address(this),
                msg.sender,
                backupAddresses[msg.sender],
                amount,
                nonce,
                deadline
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == msg.sender, "ILVIToken: invalid signature");

        nonces[msg.sender] = nonces[msg.sender] + 1;
        _transfer(msg.sender, backupAddresses[msg.sender], amount);
        blacklist[backupAddresses[msg.sender]] = true;
        emit EmergencyTransfer(msg.sender, backupAddresses[msg.sender], amount);
    }

    /**
     * @notice blacklists an address.
     * @dev Only callable by the owner.
     * @param account The address to blacklist.
     */
    function blacklistAddress(address account) public onlyOwner {
        require(account != address(0), "ILVIToken: account is the zero address");
        require(!blacklist[account], "ILVIToken: account is blacklisted");
        require(account != owner(), "ILVIToken: account is the owner");

        blacklist[account] = true;
        emit BlacklistedAddressAdded(account);
    }

    function domainSeparator() public view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Checks if an address is blacklisted.
     * @param account The address to check if it's blacklisted.
     */
    function isBlacklisted(address account) public view returns (bool) {
        return blacklist[account];
    }

    /**
     * @notice Gets the backup address for an account.
     * @param account The account to get the backup address for.
     */
    function getBackupAddress(address account) public view returns (address) {
        return backupAddresses[account];
    }

    /****************************************/
    /*               Internal               */
    /****************************************/

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        require(!blacklist[to], "ILVIToken: Recipient address is blacklisted.");
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        super._afterTokenTransfer(from, to, amount);
    }
}
