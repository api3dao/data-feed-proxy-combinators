// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title A minimal interface for the WOS contract on Sonic network
/// @dev This interface only includes the convertToAssets function to convert
/// the WOS amount to OS.
interface IWOS {
    /// @notice Returns the amount of OS that corresponds to the WOS amount
    /// @param shares The amount of WOS to exchange
    /// @return The OS amount corresponding to the WOS shares
    function convertToAssets(uint256 shares) external view returns (uint256);
}
