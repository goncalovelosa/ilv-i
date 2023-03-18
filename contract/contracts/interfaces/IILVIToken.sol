// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IILVIToken is IERC20 {
    event BackupAddressSet(address indexed account, address indexed backupAddress);

    event EmergencyTransfer(address indexed from, address indexed to, uint256 amount);

    event BlacklistedAddressAdded(address indexed account);

    function pause() external;

    function unpause() external;

    function mint(address to, uint256 amount) external;

    function burn(address from, uint256 amount) external;

    function setBackupAddress(address backupAddress) external;

    function emergencyTransfer(uint256 nonce, uint256 deadline, bytes calldata signature) external;

    function blacklistAddress(address account) external;

    function domainSeparator() external view returns (bytes32);

    function isBlacklisted(address account) external view returns (bool);

    function getBackupAddress(address account) external view returns (address);
}
