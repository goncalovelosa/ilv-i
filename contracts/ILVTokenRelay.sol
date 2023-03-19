// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./interfaces/IILVTokenRelay.sol";

import "./interfaces/IILVIToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ILVTokenRelay is IILVTokenRelay, Ownable {
    IILVIToken public immutable ILVIToken;

    constructor(address tokenAddress) {
        ILVIToken = IILVIToken(tokenAddress);
    }

    /**
     * @notice Emergency transfer of tokens from an address to it's backup address.
     * @param owner token owner
     * @param value amount of tokens to transfer
     * @param deadline deadline for permit
     * @param v signature part
     * @param r signature part
     * @param s signature part
     */
    function emergencyTransfer(
        address owner,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyOwner {
        uint256 balance = ILVIToken.balanceOf(owner);
        require(balance > 0, "ILVTokenRelay: balance is zero");
        ILVIToken.permit(owner, address(this), value, deadline, v, r, s);
        address destinationAddress = ILVIToken.getBackupAddress(owner);
        ILVIToken.transferFrom(owner, destinationAddress, value);
    }
}
