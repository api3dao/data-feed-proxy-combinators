// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";
import "./interfaces/IPriceCappedApi3ReaderProxyV1.sol";

/**
 * @title An immutable proxy contract that provides a price bounding mechanism.
 * It reads the price from the underlying Api3 proxy and if this price falls
 * outside a predefined `lowerBound` and `upperBound`, this contract will report
 * the respective bound instead.
 * This is primarily intended for assets (e.g., stablecoins) where a protocol
 * wants to limit the price range it ingests for risk management purposes.
 * @dev `lowerBound` and `upperBound` are immutable and set during deployment.
 * To set only an upper bound, `lowerBound_` can be set to 0.
 * To set only a lower bound, `upperBound_` can be set to `type(int224).max`.
 * To configure a fixed price, set `lowerBound_` and `upperBound_` to the
 * same desired price.
 * If `lowerBound_` is 0 and `upperBound_` is `type(int224).max`, no effective
 * capping occurs, though negative prices from the underlying proxy would be
 * floored at 0 if `lowerBound_` is 0.
 */
contract PriceCappedApi3ReaderProxyV1 is IPriceCappedApi3ReaderProxyV1 {
    /// @notice IApi3ReaderProxy contract address
    address public immutable override proxy;

    /// @notice The minimum price (inclusive) that this proxy will report.
    int224 public immutable override lowerBound;

    /// @notice The maximum price (inclusive) that this proxy will report.
    int224 public immutable override upperBound;

    /// @param proxy_ IApi3ReaderProxy contract address
    /// @param lowerBound_ The minimum price (inclusive) this proxy will report
    /// @param upperBound_ The maximum price (inclusive) this proxy will report
    constructor(address proxy_, int224 lowerBound_, int224 upperBound_) {
        if (proxy_ == address(0)) {
            revert ZeroProxyAddress();
        }
        if (lowerBound_ < 0) {
            revert LowerBoundMustBeNonNegative();
        }
        if (upperBound_ < lowerBound_) {
            revert UpperBoundMustBeGreaterOrEqualToLowerBound();
        }
        proxy = proxy_;
        lowerBound = lowerBound_;
        upperBound = upperBound_;
    }

    /// @notice Reads the current value and timestamp from the underlying
    /// `IApi3ReaderProxy` and applies the price bounds.
    /// @dev If the `baseValue` from the underlying proxy is less than
    /// `lowerBound`, then `lowerBound` is returned as the `value`. If
    /// `baseValue` is greater than `upperBound`, then `upperBound` is returned.
    /// Otherwise, the `baseValue` is returned. The timestamp is passed through
    /// unmodified.
    /// @return value Value of the underlying proxy, potentially bounded
    /// @return timestamp Timestamp from the underlying proxy
    function read()
        public
        view
        override
        returns (int224 value, uint32 timestamp)
    {
        (int224 baseValue, uint32 baseTimestamp) = IApi3ReaderProxy(proxy)
            .read();

        timestamp = baseTimestamp;

        if (baseValue < lowerBound) {
            value = lowerBound;
        } else if (baseValue > upperBound) {
            value = upperBound;
        } else {
            value = baseValue;
        }
    }

    /// @notice Checks if the current price from the underlying proxy would be
    /// capped or floored by the bounds.
    /// @return True if the base value is less than `lowerBound` or greater
    /// than `upperBound`, false otherwise.
    function isCapped() external view returns (bool) {
        (int224 baseValue, ) = IApi3ReaderProxy(proxy).read();
        return baseValue < lowerBound || baseValue > upperBound;
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
    /// contract that acts as a Chainlink feed is a PriceCappedApi3ReaderProxyV1
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
