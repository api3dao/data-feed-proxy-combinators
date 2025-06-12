// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";
import "./interfaces/IPriceCapStableApi3ReaderProxyV1.sol";

/**
 * @title An immutable proxy contract that provides price capping mechanism.
 * It reads the price from the underlying API3 proxy and if this price exceeds a
 * predefined `priceCap`, this contract will report the `priceCap` instead.
 * This is primarily intended for assets (e.g., stablecoins) where a protocol
 * wants to limit the maximum price it ingests for risk management purposes.
 * @dev The `priceCap` is immutable and set during deployment.
 */
contract PriceCapStableApi3ReaderProxyV1 is IPriceCapStableApi3ReaderProxyV1 {
    /// @notice IApi3ReaderProxy contract address
    address public immutable override proxy;

    /// @notice The maximum price (inclusive) that this proxy will report.
    int224 public immutable override priceCap;

    /// @param proxy_ IApi3ReaderProxy contract address
    /// @param priceCap_ The maximum price value this proxy will report. Must be
    /// a positive value.
    constructor(address proxy_, int224 priceCap_) {
        if (proxy_ == address(0)) {
            revert ZeroProxyAddress();
        }
        if (priceCap_ <= 0) {
            revert PriceCapMustBePositive();
        }
        proxy = proxy_;
        priceCap = priceCap_;
    }

    /// @notice Reads the latest value and timestamp from the underlying
    /// `IApi3ReaderProxy` and applies the price cap.
    /// @dev If the `baseValue` from the underlying proxy is greater than
    /// `priceCap`, then `priceCap` is returned as the `value`. Otherwise, the
    /// `baseValue` is returned. The timestamp is passed through unmodified.
    /// @return value Value of the underlying proxy, potentially capped
    /// @return timestamp Timestamp from the underlying proxy
    function read()
        public
        view
        override
        returns (int224 value, uint32 timestamp)
    {
        (int224 baseValue, uint32 baseTimestamp) = IApi3ReaderProxy(proxy)
            .read();

        value = baseValue > priceCap ? priceCap : baseValue;
        timestamp = baseTimestamp;
    }

    /// @dev AggregatorV2V3Interface users are already responsible with
    /// validating the values that they receive (e.g., revert if the spot price
    /// of an asset is negative). Therefore, this contract omits validation.
    function latestAnswer() external view override returns (int256 value) {
        (value, ) = read();
    }

    /// @dev A Chainlink feed contract returns the block timestamp at which the
    /// feed was last updated. On the other hand, an Api3 feed timestamp
    /// denotes the point in time at which the first-party oracles signed the
    /// data used to do the last update. We find this to be a reasonable
    /// approximation, considering that usually the timestamp is only used to
    /// check if the last update is stale.
    function latestTimestamp()
        external
        view
        override
        returns (uint256 timestamp)
    {
        (, timestamp) = read();
    }

    /// @dev Api3 feeds are updated asynchronously and not in rounds
    function latestRound() external pure override returns (uint256) {
        revert FunctionIsNotSupported();
    }

    /// @dev Functions that use the round ID as an argument are not supported
    function getAnswer(uint256) external pure override returns (int256) {
        revert FunctionIsNotSupported();
    }

    /// @dev Functions that use the round ID as an argument are not supported
    function getTimestamp(uint256) external pure override returns (uint256) {
        revert FunctionIsNotSupported();
    }

    /// @dev Api3 feeds always use 18 decimals
    function decimals() external pure override returns (uint8) {
        return 18;
    }

    /// @dev Underlying proxy dApp ID and dAPI name act as the description, and
    /// this is left empty to save gas on contract deployment
    function description() external pure override returns (string memory) {
        return "";
    }

    /// @dev A unique version is chosen to easily check if an unverified
    /// contract that acts as a Chainlink feed is a PriceCapStableApi3ReaderProxyV1
    function version() external pure override returns (uint256) {
        return 4918;
    }

    /// @dev Functions that use the round ID as an argument are not supported
    function getRoundData(
        uint80
    )
        external
        pure
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        revert FunctionIsNotSupported();
    }

    /// @dev Rounds IDs are returned as `0` as invalid values.
    /// Similar to `latestAnswer()`, we leave the validation of the returned
    /// value to the caller.
    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        roundId = answeredInRound = 0;
        (answer, startedAt) = read();
        updatedAt = startedAt;
    }
}
