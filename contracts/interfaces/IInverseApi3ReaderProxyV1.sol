// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";
import "../vendor/@chainlink/contracts@1.2.0/src/v0.8/shared/interfaces/AggregatorV2V3Interface.sol";

interface IInverseApi3ReaderProxyV1 is
    IApi3ReaderProxy,
    AggregatorV2V3Interface
{
    error ZeroProxyAddress();

    error DivisionByZero();

    error FunctionIsNotSupported();

    function proxy() external view returns (address proxy);

    function dappId() external view returns (uint256);
}
