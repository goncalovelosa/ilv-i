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

    function mint(address to, uint256 amount) public override onlyOwner {
        require(to != address(0), "ERC20Backup: mint to the zero address");
        require(!_blacklisted[to], "ERC20Backup: Recipient address is blacklisted.");
        _mint(to, amount);
    }

    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner].current();
    }

    function registerEmergencyBackupAddress(address backupAddress) external {
        require(backupAddress != _msgSender(), "Backup address cannot be the same as the token holder");
        require(backupAddress != address(this), "Backup address cannot be the contract address");
        require(backupAddress != address(0), "Backup address cannot be the zero address");
        require(!_blacklisted[backupAddress], "Backup address is blacklisted");
        _emergencyBackups[_msgSender()] = backupAddress;
        emit EmergencyBackupRegistered(_msgSender(), backupAddress);
    }

    function emergencyTransfer(address signer, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external onlyOwner {
        address receiver = _emergencyBackups[signer];
        require(receiver != address(0), "No emergency backup address registered");
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

    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!_blacklisted[to], "Recipient address is blacklisted");
    }

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

    function _useNonce(address owner) internal virtual returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }
}
