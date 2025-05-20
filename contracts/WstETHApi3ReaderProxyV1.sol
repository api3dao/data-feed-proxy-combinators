// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";
import "./IWstETH.sol";

/// @title An immutable proxy contract that reads the price of wstETH directly
/// from the WstETH contract on Ethereum.
/// @dev This contract implements only the IApi3ReaderProxy and not the
/// AggregatorV2V3Interface which is usually implemented with Api3 proxies. The
/// user of this contract needs to be aware of this and only use this contract
/// where the IApi3ReaderProxy interface is expected.
contract WstETHApi3ReaderProxyV1 is IApi3ReaderProxy {
    address public constant WST_ETH =
        0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;

    constructor() {}

    /// @inheritdoc IApi3ReaderProxy
    /// @dev The value returned by this function is the stETH value scaled to 18
    /// decimals. The timestamp returned is the current block timestamp.
    function read()
        public
        view
        override
        returns (int224 value, uint32 timestamp)
    {
        uint256 stEthPerToken = IWstETH(WST_ETH).stEthPerToken();

        value = int224(int256(stEthPerToken)); // stEthPerToken value has 18 decimals.
        timestamp = uint32(block.timestamp);
    }
}
