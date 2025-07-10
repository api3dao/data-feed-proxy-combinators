// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {
    IApi3ReaderProxyV1
} from "@api3/contracts/api3-server-v1/proxies/interfaces/IApi3ReaderProxyV1.sol";

/// @title A mock contract for IApi3ReaderProxyV1
/// @dev This mock implements the minimal functions required for testing the
/// data-feed-proxy-combinators contracts. Other functions will revert.
contract MockApi3ReaderProxyV1 is IApi3ReaderProxyV1 {
    /// @notice The dApp ID of the mock proxy.
    uint256 public immutable override dappId;
    /// @notice The mock value to be returned by read().
    int224 private _value;
    /// @notice The mock timestamp to be returned by read().
    uint32 private _timestamp;

    constructor(uint256 dappId_, int224 value_, uint32 timestamp_) {
        dappId = dappId_;
        _value = value_;
        _timestamp = timestamp_;
    }

    function read() public view override returns (int224, uint32) {
        return (_value, _timestamp);
    }

    function update(int224 value, uint32 timestamp) external {
        _value = value;
        _timestamp = timestamp;
    }

    // --- Stubbed functions from IApi3ReaderProxyV1 that are not used by combinators ---

    function initialize(address) external pure override {
        revert("Mock: Not implemented");
    }

    function api3ServerV1() external pure override returns (address) {
        revert("Mock: Not implemented");
    }

    function api3ServerV1OevExtension()
        external
        pure
        override
        returns (address)
    {
        revert("Mock: Not implemented");
    }

    function dapiName() external pure override returns (bytes32) {
        revert("Mock: Not implemented");
    }
}
