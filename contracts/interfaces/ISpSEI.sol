// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title A minimal interface for the spSEI contract on Sei network
/// @dev This interface only includes the getExchangeRatio function needed to read
/// the exchange rate between SEI and spSEI.
interface ISpSEI {
    /// @notice Returns the amount of spSEI that corresponds to 1 SEI
    /// @return The SEI/spSEI exchange rate with 18 decimals precision
    function getExchangeRatio() external view returns (uint256);
}
