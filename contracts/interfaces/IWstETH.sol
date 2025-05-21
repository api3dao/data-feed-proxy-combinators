// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title A minimal interface for the wstETH contract on Ethereum, used to read
/// the stETH value per token value of 1 unit of wstETH.
/// @dev The returned value is scaled to 18 decimals.
interface IWstETH {
    /// @return The stETH value per token value of 1 unit of wstETH, scaled to 18 decimals.
    function stEthPerToken() external view returns (uint256);
}
