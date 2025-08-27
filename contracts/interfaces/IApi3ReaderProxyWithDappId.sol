// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@api3/contracts/interfaces/IApi3ReaderProxy.sol";

interface IApi3ReaderProxyWithDappId is IApi3ReaderProxy {
    function dappId() external view returns (uint256);
}
