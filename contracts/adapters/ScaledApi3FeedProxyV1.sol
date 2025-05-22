// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";
import "./interfaces/IScaledApi3FeedProxyV1.sol";

/// @title An immutable Chainlink AggregatorV2V3Interface feed contract that
/// scales the value of an IApi3ReaderProxy data feed to a target number of
/// decimals
/// @dev This contract assumes the source proxy always returns values with
/// 18 decimals (as all IApi3ReaderProxy-compatible proxies do)
contract ScaledApi3FeedProxyV1 is IScaledApi3FeedProxyV1 {
    /// @notice IApi3ReaderProxy contract address
    address public immutable override proxy;

    /// @dev Target decimals for the scaled value.
    uint8 private immutable targetDecimals;

    /// @dev Pre-calculated factor for scaling from 18 decimals.
    int256 private immutable scalingFactor;

    /// @dev True for upscaling (multiply by scalingFactor), else downscaling
    /// (divide by scalingFactor).
    bool private immutable isUpscaling;

    /// @param proxy_ IApi3ReaderProxy contract address
    /// @param targetDecimals_ Decimals used to scale the IApi3ReaderProxy value
    constructor(address proxy_, uint8 targetDecimals_) {
        if (proxy_ == address(0)) {
            revert ZeroProxyAddress();
        }
        if (targetDecimals_ == 0 || targetDecimals_ > 36) {
            revert InvalidDecimals();
        }
        if (targetDecimals_ == 18) {
            revert NoScalingNeeded();
        }
        proxy = proxy_;
        targetDecimals = targetDecimals_;
        uint8 delta = targetDecimals_ > 18
            ? targetDecimals_ - 18
            : 18 - targetDecimals_;
        scalingFactor = int256(10 ** uint256(delta));
        isUpscaling = targetDecimals_ > 18;
    }

    /// @dev AggregatorV2V3Interface users are already responsible with
    /// validating the values that they receive (e.g., revert if the spot price
    /// of an asset is negative). Therefore, this contract omits validation.
    function latestAnswer() external view override returns (int256 value) {
        (value, ) = _read();
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
        (, timestamp) = _read();
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

    /// @dev Decimals used to scale the IApi3ReaderProxy value
    function decimals() external view override returns (uint8) {
        return targetDecimals;
    }

    /// @dev Underlying proxy dApp ID and dAPI name act as the description, and
    /// this is left empty to save gas on contract deployment
    function description() external pure override returns (string memory) {
        return "";
    }

    /// @dev A unique version is chosen to easily check if an unverified
    /// contract that acts as a Chainlink feed is a ScaledApi3FeedProxyV1
    function version() external pure override returns (uint256) {
        return 4917;
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
        (answer, startedAt) = _read();
        updatedAt = startedAt;
    }

    /// @notice Reads a value from the underlying `IApi3ReaderProxy` and
    /// scales it to `targetDecimals`.
    /// @dev Reads an `int224` value (assumed to be 18 decimals) from the
    /// underlying `IApi3ReaderProxy`. This value is then scaled to
    /// `targetDecimals` using pre-calculated factors. The scaling arithmetic
    /// (e.g., `proxyValue * scalingFactor`) involves an `int224` (`proxyValue`)
    /// and an `int256` (`scalingFactor`). `proxyValue` is implicitly promoted
    /// to `int256` for this operation, resulting in an `int256` value.
    /// This allows the scaled result to exceed the `int224` range, provided
    /// it fits within `int256`. Arithmetic operations will revert on `int256`
    /// overflow. The function returns the scaled value as an `int256`.
    /// @return value The scaled signed fixed-point value with `targetDecimals`.
    /// @return timestamp The timestamp from the underlying proxy.
    function _read() internal view returns (int256 value, uint32 timestamp) {
        (int224 proxyValue, uint32 proxyTimestamp) = IApi3ReaderProxy(proxy)
            .read();

        value = isUpscaling
            ? proxyValue * scalingFactor
            : proxyValue / scalingFactor;
        timestamp = proxyTimestamp;
    }
}
