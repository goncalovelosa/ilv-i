// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IILVIToken is IERC20 {
    event BackupAddressSet(address indexed account, address indexed backupAddress);

    event EmergencyTransfer(address indexed from, address indexed to, uint256 amount);

    event BlacklistedAddressAdded(address indexed account);

    function mint(address to, uint256 amount) external;

    function burn(address from, uint256 amount) external;

    function setBackupAddress(address backupAddress) external;

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function emergencyTransfer(address from, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;

    function blacklistAddress(address account) external;

    function isBlacklisted(address account) external view returns (bool);

    function getBackupAddress(address account) external view returns (address);
}
