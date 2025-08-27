// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../vendor/@chainlink/contracts@1.2.0/src/v0.8/shared/interfaces/AggregatorV2V3Interface.sol";
import "./IApi3ReaderProxyWithDappId.sol";

interface IProductApi3ReaderProxyV1 is
    IApi3ReaderProxyWithDappId,
    AggregatorV2V3Interface
{
    error ZeroProxyAddress();

    error SameProxyAddress();

    error DappIdMismatch();

    error ZeroDenominator();

    error FunctionIsNotSupported();

    function proxy1() external view returns (address);

    function proxy2() external view returns (address);
}
