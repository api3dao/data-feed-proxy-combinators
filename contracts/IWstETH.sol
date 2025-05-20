// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title A minimal interface for the wstETH contract on Ethereum, used to read
/// the stETH value per token value of 1 unit of wstETH.
interface IWstETH {
    /// @notice Returns the stETH value per token value of 1 unit of wstETH.
    function stEthPerToken() external view returns (uint256);
}
