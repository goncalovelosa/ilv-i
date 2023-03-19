// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./interfaces/IILVIToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20, ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract ILVIToken is IILVIToken, ERC20, ERC20Permit, Ownable {
    mapping(address => address) public backupAddresses;
    mapping(address => bool) public blacklist;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {}

    /****************************************/
    /*               Public                 */
    /****************************************/

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
        _setBackupAccount(msg.sender, backupAddress);
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override(ERC20Permit, IILVIToken) {
        require(spender != address(0), "ILVIToken: spender is the zero address");
        require(!blacklist[owner], "ILVIToken: owner address is blacklisted");
        require(!blacklist[spender], "ILVIToken: spender address is blacklisted");
        super.permit(owner, spender, value, deadline, v, r, s);
    }

    /**
     * @notice Approves and transfers tokens from one address to another.
     * @dev Only callable by non blacklisted address.
     * @param from The address to transfer tokens from.
     * @param deadline The address to transfer tokens to.
     * @param v The
     * @param r The
     * @param s The
     */
    function emergencyTransfer(address from, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public {
        uint256 amount = balanceOf(from);
        require(amount > 0, "ILVIToken: no tokens to transfer");
        address to = backupAddresses[from];
        require(to != address(0), "ILVIToken: backup address is not set");
        permit(from, to, amount, deadline, v, r, s);
        transferFrom(from, to, amount);
        emit EmergencyTransfer(from, to, amount);
        _blacklistAddress(from);
    }

    /**
     * @notice blacklists an address.
     * @dev Only callable by the owner.
     * @param account The address to blacklist.
     */
    function blacklistAddress(address account) public onlyOwner {
        require(account != address(0), "ILVIToken: account is the zero address");
        require(!blacklist[account], "ILVIToken: account is blacklisted");
        _blacklistAddress(account);
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

    function _setBackupAccount(address origninalAccount, address backupAccount) internal {
        backupAddresses[origninalAccount] = backupAccount;
        emit BackupAddressSet(origninalAccount, backupAccount);
    }

    function _blacklistAddress(address account) internal virtual {
        require(account != owner(), "ILVIToken: account is the owner");

        blacklist[account] = true;
        emit BlacklistedAddressAdded(account);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        require(!blacklist[to], "ILVIToken: Recipient address is blacklisted.");
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override {
        super._afterTokenTransfer(from, to, amount);
    }
}
