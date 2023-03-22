// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Backup is IERC20 {
    function mint(address to, uint256 amount) external;

    function nonces(address owner) external view returns (uint256);

    function registerEmergencyBackupAddress(address backupAddress) external;

    function emergencyTransfer(address signer, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;

    function isBlacklisted(address account) external view returns (bool);
}
