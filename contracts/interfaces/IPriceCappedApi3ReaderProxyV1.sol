// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../vendor/@chainlink/contracts@1.2.0/src/v0.8/shared/interfaces/AggregatorV2V3Interface.sol";
import "./IApi3ReaderProxyWithDappId.sol";

interface IPriceCappedApi3ReaderProxyV1 is
    IApi3ReaderProxyWithDappId,
    AggregatorV2V3Interface
{
    error ZeroProxyAddress();

    error LowerBoundMustBeNonNegative();

    error UpperBoundMustBeGreaterOrEqualToLowerBound();

    error FunctionIsNotSupported();

    function proxy() external view returns (address);

    function lowerBound() external view returns (int224);

    function upperBound() external view returns (int224);

    function isCapped() external view returns (bool);
}
