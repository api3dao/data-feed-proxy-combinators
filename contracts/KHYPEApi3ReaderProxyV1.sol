// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";

// Minimal interface for StakingAccountant
interface IStakingAccountant {
    function kHYPEToHYPE(uint256 kHYPEAmount) external view returns (uint256);
}

/// @title An immutable proxy contract that reads the kHYPE/HYPE exchange rate on
/// the HyperEVM network.
/// from the StakingAccountant contract.
/// @dev This contract implements only the IApi3ReaderProxy and not the
/// AggregatorV2V3Interface which is usually implemented with Api3 proxies. The
/// user of this contract needs to be aware of this and only use this contract
/// where the IApi3ReaderProxy interface is expected.
contract KHYPEApi3ReaderProxyV1 is IApi3ReaderProxy {
    /// @dev Address of the StakingAccountant contract. This address belongs to
    /// the deployment on HyperEVM chain.
    IStakingAccountant public constant STAKING_ACCOUNTANT =
        IStakingAccountant(0x9209648Ec9D448EF57116B73A2f081835643dc7A);

    /// @inheritdoc IApi3ReaderProxy
    /// @dev The value returned by this function is the HYPE amount for 1 kHYPE,
    /// scaled to 18 decimals. The timestamp returned is the current block
    /// timestamp.
    function read()
        public
        view
        override
        returns (int224 value, uint32 timestamp)
    {
        // The kHYPEToHYPE function returns the amount of HYPE for a given amount
        // of kHYPE.
        // 1e18 is passed (representing 1 kHYPE, as it has 18 decimals) to get
        // the rate.
        uint256 HYPEPerKHYPE = STAKING_ACCOUNTANT.kHYPEToHYPE(1e18);

        value = int224(int256(HYPEPerKHYPE));
        timestamp = uint32(block.timestamp);
    }
}
