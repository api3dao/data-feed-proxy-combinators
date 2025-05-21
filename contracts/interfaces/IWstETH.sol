// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title A minimal interface for the wstETH contract on Ethereum
/// @dev This interface only includes the stEthPerToken function needed to read
/// the exchange rate between stETH and wstETH.
interface IWstETH {
    /// @notice Returns the amount of stETH that corresponds to 1 wstETH
    /// @return The stETH/wstETH exchange rate with 18 decimals precision
    function stEthPerToken() external view returns (uint256);
}
