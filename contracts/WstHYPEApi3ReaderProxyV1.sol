// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";

// Minimal interface for wstHYPE
interface IWstHYPE {
    function sthype() external view returns (address);
}

// Minimal interface for stHYPE
interface IStHYPE {
    function sharesToBalance(uint256 shares) external view returns (uint256);
}

/// @title An immutable proxy contract that reads the wstHYPE/stHYPE exchange
/// rate on the HyperEVM network.
/// @dev This contract implements only the IApi3ReaderProxy and not the
/// AggregatorV2V3Interface which is usually implemented with Api3 proxies. The
/// user of this contract needs to be aware of this and only use this contract
/// where the IApi3ReaderProxy interface is expected.
contract WstHYPEApi3ReaderProxyV1 is IApi3ReaderProxy {
    /// @dev Address of the wstHYPE contract. This address belongs to the
    /// deployment on HyperEVM chain.
    IWstHYPE public constant WST_HYPE =
        IWstHYPE(0x94e8396e0869c9F2200760aF0621aFd240E1CF38);

    /// @inheritdoc IApi3ReaderProxy
    /// @dev The value returned by this function is the stHYPE amount for 1
    /// wstHYPE, scaled to 18 decimals. The timestamp returned is the current
    /// block timestamp.
    function read()
        public
        view
        override
        returns (int224 value, uint32 timestamp)
    {
        address stHYPEAddress = WST_HYPE.sthype();

        // The logic is analogous to wstETH's stEthPerToken(), which returns
        // stETH.getPooledEthByShares(1 ether).
        // Here, it is assumed 1 wstHYPE corresponds to 1e24 shares of stHYPE, as
        // stHYPE shares have 24 decimals.
        // These shares are then converted to a balance of stHYPE (which has 18
        // decimals).
        uint256 stHYPEPerToken = IStHYPE(stHYPEAddress).sharesToBalance(1e24);

        value = int224(int256(stHYPEPerToken));
        timestamp = uint32(block.timestamp);
    }
}
