// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";
import "./interfaces/IWOS.sol";

/// @title An immutable proxy contract that reads the WOS/OS exchange rate
/// directly from the WOS contract on Sonic network.
/// @dev This contract implements only the IApi3ReaderProxy interface and not the
/// AggregatorV2V3Interface which is usually implemented by Api3 proxies. The
/// user of this contract needs to be aware of this limitation and only use this
/// contract where the IApi3ReaderProxy interface is expected.
contract WOSApi3ReaderProxyV1 is IApi3ReaderProxy {
    /// @notice The address of the WOS contract on Sonic network.
    address public constant WOS = 0x9F0dF7799f6FDAd409300080cfF680f5A23df4b1;

    /// @inheritdoc IApi3ReaderProxy
    /// @dev Returns the WOS/OS exchange rate with 18 decimals precision.
    /// The timestamp returned is the current block timestamp.
    function read()
        public
        view
        override
        returns (int224 value, uint32 timestamp)
    {
        value = int224(int256(IWOS(WOS).convertToAssets(1e18))); // 1 WOS to OS conversion
        timestamp = uint32(block.timestamp);
    }
}
