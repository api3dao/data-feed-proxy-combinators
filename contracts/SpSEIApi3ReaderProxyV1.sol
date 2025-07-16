// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";
import "./interfaces/ISpSEI.sol";

/// @title An immutable proxy contract that reads the SEI per spSEI ratio
/// directly from the spSEI contract on Sei network.
/// @dev This contract implements only the IApi3ReaderProxy interface and not the
/// AggregatorV2V3Interface which is usually implemented by Api3 proxies. The
/// user of this contract needs to be aware of this limitation and only use this
/// contract where the IApi3ReaderProxy interface is expected.
contract SpSEIApi3ReaderProxyV1 is IApi3ReaderProxy {
    /// @notice The address of the spSEI contract on Sei network.
    address public constant SP_SEI = 0xa776cbdD531FB3b7BA6c8fF0fBdEb84138CAB78B;

    /// @inheritdoc IApi3ReaderProxy
    /// @dev Returns the spSEI/SEI exchange rate with 18 decimals precision.
    /// The timestamp returned is the current block timestamp.
    function read()
        public
        view
        override
        returns (int224 value, uint32 timestamp)
    {
        uint256 exchangeRatio = ISpSEI(SP_SEI).getExchangeRatio(); // Returns the spSEI amount worth of 1 SEI.

        value = int224(int256(1e36) / int256(exchangeRatio)); // spSEI amount uses 18 decimals.
        timestamp = uint32(block.timestamp);
    }
}
