# @api3/data-feed-proxy-combinators

## Overview

> For general information about Api3 data feeds, dAPIs, and other services, end users are recommended to refer to the [official Api3 dApp documentation](https://docs.api3.org/dapps/).

Api3 delivers reliable, first-party oracle data via dAPIs (continuously updated data feeds). However, dApps often require this data in formats or derivations not directly provided by a base dAPI, such as inverted prices (e.g., USD/ETH from ETH/USD), scaled values, or new feeds derived from combining multiple dAPIs (e.g., BTC/ETH from BTC/USD and ETH/USD). Data Feed Proxy Combinators address this as (soon-to-be) audited, standardized, and reusable smart contracts. These combinators operate on top of existing `IApi3ReaderProxy` contracts, enabling developers to combine them or transform their output to read data in different formats or derive new data feeds on-chain. This approach avoids repetitive, error-prone, and gas-intensive custom logic within individual dApps and the impracticality of deploying new oracles for minor data variations, thereby enhancing code reuse and reliability.
Being documented, easily usable, and officially recommended by Api3, they offer a trusted and straightforward way for developers to implement these common data transformations.

⚠️ Important Note: These combinator proxies are designed as lightweight wrappers. They do not perform additional validation on the data (e.g., value sanity checks or timestamp verification) returned by the underlying dAPIs or external feeds. The responsibility for data quality and timeliness rests with the source oracle or feed provider. Furthermore, these contracts are provided "as is" without any warranty, and there is no financial coverage or insurance associated with their use.

### Core Capabilities

Data Feed Proxy Combinators provide modular and composable smart contracts for on-chain data feed adaptation. They typically take the address(es) of underlying feed(s) and operational parameters (like scaling factors) in their constructors. Key contract implementations include:

- **`InverseApi3ReaderProxyV1`**: Takes an underlying `IApi3ReaderProxy` (e.g., ETH/USD). Its `read()` method returns the inverse of the underlying feed's value (e.g., `1 / (ETH/USD value)` to represent USD/ETH), exposing an `IApi3ReaderProxy` interface.
- **`ScaledApi3FeedProxyV1`**: Reads from an underlying `IApi3ReaderProxy`, scales its value to a specified number of decimal places, and exposes the Chainlink `AggregatorV2V3Interface`. This makes an Api3 data feed, with adjusted precision, consumable by systems expecting a Chainlink-compatible interface with arbitrary decimals.
- **`ProductApi3ReaderProxyV1`**: Takes two underlying `IApi3ReaderProxy` instances. Its `read()` method returns the product of their values, implementing the `IApi3ReaderProxy` interface.
- **`NormalizedApi3ReaderProxyV1`**: Reads from an external data feed implementing the Chainlink-compatible `AggregatorV2V3Interface` and exposes the standard Api3 `IApi3ReaderProxy` interface. This allows dApps expecting an Api3 feed to consume data from other sources, useful for migration.
- **`PriceCappedApi3ReaderProxyV1`**: Wraps an `IApi3ReaderProxy` to enforce price bounds. If the underlying price goes below `lowerBound` or above `upperBound`, the respective bound is returned. Implements `IPriceCappedApi3ReaderProxyV1` (thus `IApi3ReaderProxy` and `AggregatorV2V3Interface`) and includes an `isCapped()` check. Ideal for risk management, like ensuring stablecoin prices remain within a defined range or limiting exposure to extreme volatility.

These combinators either consume and expose the Api3 `IApi3ReaderProxy` interface or act as adapters to/from other interfaces like Chainlink's `AggregatorV2V3Interface`. This facilitates integration within the Api3 ecosystem or when bridging with other oracle systems. The output of one combinator can often serve as input for another, enabling complex data transformation pipelines.

## Security

- [2025-06-13 Quantstamp](./audit-reports/2025-06-13%20Quantstamp.pdf)

For bug reports, contact `security@api3.org`

## Deployment Guide

This guide provides step-by-step instructions for dApp developers who need to deploy and use these Data Feed Proxy Combinator contracts.

### 1. Prerequisites

- **Clone the Repository**:
  ```bash
  git clone https://github.com/api3dao/data-feed-proxy-combinators.git
  cd data-feed-proxy-combinators
  ```
- **Install Dependencies**: This project uses `pnpm` as the package manager.
  ```bash
  pnpm install
  ```

### 2. Environment Setup (.env file)

You'll need to set up a `.env` file in the root of the project to store a mnemonic, RPC provider URLs, and API keys for block explorers.

- Create a `.env` file by copying the example:

  ```bash
  cp .env.example .env
  ```

  Or create a `.env` file manually with the following content:

  ```env
  # Mnemonic of the account you want to use for deployment
  # IMPORTANT: Never commit this file to version control.
  MNEMONIC="your twelve word mnemonic phrase here"

  # RPC Provider URLs. Only add these if you want to override the defaults provided
  # by @api3/contracts or for networks that require a specific URL.
  # The environment variable name must follow the pattern:
  # HARDHAT_HTTP_RPC_URL_<NETWORK_NAME_UPPERCASE_WITH_UNDERSCORES>
  # where <NETWORK_NAME_UPPERCASE_WITH_UNDERSCORES> corresponds to a network
  # name defined in @api3/contracts (e.g., ETHEREUM_SEPOLIA_TESTNET, ARBITRUM_MAINNET).

  # Example for Sepolia testnet (replace with your actual provider URL):
  HARDHAT_HTTP_RPC_URL_ETHEREUM_SEPOLIA_TESTNET=https://sepolia.infura.io/v3/your_infura_project_id
  # Example for Arbitrum Mainnet (replace with your actual provider URL if needed):
  # HARDHAT_HTTP_RPC_URL_ARBITRUM_MAINNET=https://arb1.arbitrum.io/rpc

  # API keys for block explorers. The @api3/contracts package configures Hardhat
  # to use these for contract verification on various networks (including those using
  # explorers like Polygonscan, Arbiscan, etc., not just Etherscan.io).
  # The environment variable name must follow the pattern:
  # ETHERSCAN_API_KEY_<NETWORK_NAME_UPPERCASE_WITH_UNDERSCORES>
  # where <NETWORK_NAME_UPPERCASE_WITH_UNDERSCORES> corresponds to a network
  # name defined in @api3/contracts (e.g., ETHEREUM_SEPOLIA_TESTNET, POLYGON_MAINNET).

  # Example for Sepolia testnet:
  ETHERSCAN_API_KEY_ETHEREUM_SEPOLIA_TESTNET=your_etherscan_api_key_for_sepolia
  # Example for Polygon Mainnet:
  # ETHERSCAN_API_KEY_POLYGON_MAINNET=your_polygonscan_api_key
  # Example for Arbitrum Mainnet:
  # ETHERSCAN_API_KEY_ARBITRUM_MAINNET=your_arbiscan_api_key
  ```

_Note: This repository uses Hardhat. The `hardhat.config.ts` file relies on these environment variables for proper configuration. Specifically, the `networks` and `etherscan` properties are automatically configured using helper functions from the [`@api3/contracts`](https://github.com/api3dao/contracts/blob/main/src/hardhat-config.ts) package._

### 3. Deploying Contracts

This repository uses `hardhat-deploy` for managing deployments. Each combinator contract has a corresponding deployment script.

To deploy a specific contract, you need to set the `NETWORK` environment variable and any contract-specific environment variables required by its deployment script. Then, use the corresponding `pnpm deploy:<ContractName>` script.

The `NETWORK` variable should be set to a chain name as defined by `@api3/contracts` (e.g., `ethereum-sepolia-testnet`, `polygon-mainnet`, `base-mainnet`). You can find a list of available chain names [here](https://github.com/api3dao/contracts/blob/main/src/generated/chains.ts).

**Required Environment Variables per Contract:**

- **`InverseApi3ReaderProxyV1`**:
  - `NETWORK`: Target network name.
  - `PROXY`: Address of the underlying `IApi3ReaderProxy` contract (e.g., an ETH/USD dAPI proxy).
  - Example:
    ```bash
    NETWORK=ethereum-sepolia-testnet PROXY=0xUnderlyingProxyAddress pnpm deploy:InverseApi3ReaderProxyV1
    ```

- **`NormalizedApi3ReaderProxyV1`**:
  - `NETWORK`: Target network name.
  - `FEED`: Address of the external data feed (e.g., a Chainlink `AggregatorV2V3Interface` compatible feed).
  - `DAPP_ID`: The dApp ID to associate with this proxy.
  - Example:
    ```bash
    NETWORK=polygon FEED=0xExternalFeedAddress DAPP_ID=YourDappId pnpm deploy:NormalizedApi3ReaderProxyV1
    ```

- **`ProductApi3ReaderProxyV1`**:
  - `NETWORK`: Target network name.
  - `PROXY1`: Address of the first `IApi3ReaderProxy` contract.
  - `PROXY2`: Address of the second `IApi3ReaderProxy` contract.
  - Example:
    ```bash
    NETWORK=arbitrum PROXY1=0xProxy1Address PROXY2=0xProxy2Address pnpm deploy:ProductApi3ReaderProxyV1
    ```

- **`ScaledApi3FeedProxyV1`**:
  - `NETWORK`: Target network name.
  - `PROXY`: Address of the underlying `IApi3ReaderProxy` contract.
  - `DECIMALS`: The desired number of decimals for the scaled output.
  - Example:
    ```bash
    NETWORK=base PROXY=0xUnderlyingProxyAddress DECIMALS=8 pnpm deploy:ScaledApi3FeedProxyV1
    ```

- **`PriceCappedApi3ReaderProxyV1`**:
  - `NETWORK`: Target network name.
  - `PROXY`: Address of the underlying `IApi3ReaderProxy` contract.
  - `LOWER_BOUND`: The minimum price (inclusive) this proxy will report, as a full integer string (e.g., `"990000000000000000"` for $0.99 with 18 decimals). **Optional: Defaults to `"0"` if not provided (effectively setting only an upper bound).**
  - `UPPER_BOUND`: The maximum price (inclusive) this proxy will report, as a full integer string (e.g., `"1010000000000000000"` for $1.01 with 18 decimals). **Optional: Defaults to the maximum `int224` value (`(2**223 - 1)`) if not provided (effectively setting only a lower bound).** To configure a fixed price, set `UPPER_BOUND`to the same value as`LOWER_BOUND`.
  - Example (for a stablecoin expected to be around $1.00, with 18 decimals, capped between $0.99 and $1.01):
    ```bash
    NETWORK=ethereum PROXY=0xUsdcUsdDapiAddress LOWER_BOUND="990000000000000000" UPPER_BOUND="1010000000000000000" pnpm deploy:PriceCappedApi3ReaderProxyV1
    ```
  - Example (upper cap only at $1.05 for an asset, 18 decimals):
    ```bash
    NETWORK=ethereum PROXY=0xAssetDapiAddress UPPER_BOUND="1050000000000000000" pnpm deploy:PriceCappedApi3ReaderProxyV1 # LOWER_BOUND defaults to "0"
    ```
  - Example (fixed price at $1.00 for an asset, 18 decimals):
    ```bash
    NETWORK=ethereum PROXY=0xStablecoinDapiAddress LOWER_BOUND="1000000000000000000" UPPER_BOUND="1000000000000000000" pnpm deploy:PriceCappedApi3ReaderProxyV1
    ```
  - Example (lower cap only at $0.95 for an asset, 18 decimals):
    ```bash
    NETWORK=ethereum PROXY=0xAssetDapiAddress LOWER_BOUND="950000000000000000" pnpm deploy:PriceCappedApi3ReaderProxyV1 # UPPER_BOUND defaults to max int224
    ```
  - Example (no effective capping / pass-through, 18 decimals):
    ```bash
    NETWORK=ethereum PROXY=0xAssetDapiAddress pnpm deploy:PriceCappedApi3ReaderProxyV1 # LOWER_BOUND defaults to "0" (floors negative prices), UPPER_BOUND defaults to max int224
    ```

_Note: The specific `pnpm deploy:<ContractName>` scripts for each combinator are defined in the `package.json` file._

**Deployment Artifacts**: After deployment, contract artifacts (including ABI and deployed address) are saved in the `deployments/<network_name>/` directory.
For example, deploying `InverseApi3ReaderProxyV1` to the `ethereum-sepolia-testnet` network would create an artifact file like `deployments/ethereum-sepolia-testnet/InverseApi3ReaderProxyV1_SomeHash.json`. The `_SomeHash` part is derived from the constructor arguments, allowing multiple instances of the same contract with different configurations to be deployed and tracked.
These artifact files contain the deployed contract address, ABI, and the constructor arguments used for deployment (look for the `"args"` array in the JSON file). This information is crucial for integration and manual verification if needed.

**Contract Verification**:
The deployment scripts automatically attempt to verify the contract on the appropriate block explorer (e.g., Etherscan for Ethereum networks, Polygonscan for Polygon) after a successful deployment. This process uses the API keys (e.g., `ETHERSCAN_API_KEY_ETHEREUM_SEPOLIA_TESTNET`, `ETHERSCAN_API_KEY_POLYGON_MAINNET`) configured in your `.env` file, as described in "### 2. Environment Setup".
If verification fails during the deployment (e.g., due to network latency or an explorer API issue), you can simply re-run the exact same deployment command. `hardhat-deploy` is idempotent; it will detect that the contract is already deployed with the same arguments and bytecode, skip the deployment step, and only re-attempt the verification.

### 4. Combining Contracts (Advanced Usage)

The true power of these combinators is realized when they are chained together. The deployed address of one combinator contract can serve as an input (a constructor argument, typically an `IApi3ReaderProxy` or `AggregatorV2V3Interface` address) for another. This allows you to build sophisticated data transformation pipelines tailored to your dApp's specific needs.

Below are some common scenarios illustrating how you can combine these proxies:

**Scenario 1: Inverting and Scaling a dAPI**

Imagine your dApp requires a USD/ETH price feed with 8 decimal places, but the available Api3 dAPI provides ETH/USD with 18 decimals.

1.  **Deploy `InverseApi3ReaderProxyV1`**:
    - Input `PROXY`: Address of the ETH/USD `IApi3ReaderProxy` dAPI.
    - Output: An `IApi3ReaderProxy` contract. This deployed instance of `InverseApi3ReaderProxyV1` reads USD/ETH.
    - Example command: `NETWORK=base PROXY=0xAddressOfEthUsdDapi pnpm deploy:InverseApi3ReaderProxyV1`

2.  **Deploy `ScaledApi3FeedProxyV1`**:
    - Input `PROXY`: Address of the `InverseApi3ReaderProxyV1` instance deployed in step 1.
    - Input `DECIMALS`: `8`.
    - Output: An `AggregatorV2V3Interface` contract. This deployed instance of `ScaledApi3FeedProxyV1` reads USD/ETH scaled to 8 decimals.
    - Example command: `NETWORK=base PROXY=0xAddressOfDeployedInverseApi3ReaderProxyV1FromStep1 DECIMALS=8 pnpm deploy:ScaledApi3FeedProxyV1`
      _Note: Replace `0xAddressOfDeployedInverseApi3ReaderProxyV1FromStep1` with the actual address obtained from the deployment artifact of step 1._

This pipeline successfully provides the dApp with the required USD/ETH feed at the desired precision and interface.

**Scenario 2: Deriving a Real-World Feed (stETH/USD) by Combining Custom On-Chain Data with an Api3 dAPI**

Suppose your dApp needs an `stETH/USD` price feed. This specific feed might not be directly available, but you can construct it using:

1.  The `stETH/wstETH` exchange rate, obtainable directly from the `wstETH` smart contract (e.g., via its `stEthPerToken()` function).
2.  An existing Api3 dAPI for `wstETH/USD`

To achieve this, you would:

1.  **Create and Deploy a Custom `IApi3ReaderProxy` for `stETH/wstETH`**:
    - Since the `wstETH` contract's `stEthPerToken()` function doesn't directly implement the `IApi3ReaderProxy` interface, you'd first deploy a simple wrapper contract. This wrapper (let's call it `WstETHApi3ReaderProxyV1`) would call `stEthPerToken()` and expose the result (`stETH` amount for 1 `wstETH` with 18 decimals) and the current block timestamp via the `read()` method of `IApi3ReaderProxy`.
      _Note: An example of such a deployed custom proxy is `WstETHApi3ReaderProxyV1` at `0x3EA363B8CE16A26BFF70484883587DcF7E53C27d` on Ethereum mainnet. The development of this custom wrapper is outside the scope of the data-feed-proxy-combinators repository but illustrates how any data source can be adapted to be `IApi3ReaderProxy` compatible._

2.  **Deploy `ProductApi3ReaderProxyV1` to calculate `stETH/USD`**:
    - This step multiplies the `stETH/wstETH` rate (from your custom proxy) by the `wstETH/USD` rate (from the Api3 dAPI).
    - Input `PROXY1`: Address of `WstETHApi3ReaderProxyV1` (e.g., `0x3EA363B8CE16A26BFF70484883587DcF7E53C27d` on Ethereum mainnet).
    - Input `PROXY2`: Address of the Api3 `wstETH/USD` dAPI proxy (e.g., `0x37422cC8e1487a0452cc0D0BF75877d86c63c88A` on Ethereum mainnet).
    - Output: An `IApi3ReaderProxy` contract. This deployed instance of `ProductApi3ReaderProxyV1` (e.g., the one at `0xeC4031539b851eEc918b41FE3e03d7236fEc7be8` on Ethereum mainnet) reads `stETH/USD`.
      - Calculation: `(stETH/wstETH) * (wstETH/USD) = stETH/USD`.
    - Example command: `NETWORK=ethereum-mainnet PROXY1=0x3EA363B8CE16A26BFF70484883587DcF7E53C27d PROXY2=0x37422cC8e1487a0452cc0D0BF75877d86c63c88A pnpm deploy:ProductApi3ReaderProxyV1`

This scenario effectively demonstrates how `ProductApi3ReaderProxyV1` can be used with a mix of standard Api3 dAPIs and custom `IApi3ReaderProxy`-compatible sources, including those that bring on-chain calculations into the combinator ecosystem.

**Scenario 3: Normalizing an External Feed and Combining it with an Api3 dAPI**

Suppose your dApp needs a price for a less common asset, like "UnsupportedStakedETH" (uStETH), in terms of USD (uStETH/USD). This specific feed (uStETH/USD) might not be directly available as an Api3 dAPI, but you have access to:

1.  An Api3 dAPI for ETH/USD.
2.  An external, Chainlink-compatible feed for uStETH/ETH (e.g., from a DEX or a specialized provider). This uStETH/ETH feed is not listed on the Api3 market, perhaps due to specific listing requirements or its niche nature.

To derive the desired uStETH/USD feed and make it compatible with the Api3 ecosystem, you can combine these feeds:

1.  **Deploy `NormalizedApi3ReaderProxyV1`**:
    - This step adapts the external uStETH/ETH feed, which implements the `AggregatorV2V3Interface`, to the `IApi3ReaderProxy` interface. A key function of `NormalizedApi3ReaderProxyV1` is to read the `decimals()` from the external feed and automatically scale its value to the 18 decimal places expected by the `IApi3ReaderProxy` interface. For instance, if the uStETH/ETH feed returns its value with a different precision (e.g., 8 or 36 decimals), this proxy will normalize it.
    - Input `FEED`: Address of the external uStETH/ETH `AggregatorV2V3Interface` feed.
    - Input `DAPP_ID`: The dApp ID to associate with this proxy.
    - Output: An `IApi3ReaderProxy` contract. This deployed instance of `NormalizedApi3ReaderProxyV1` reads uStETH/ETH, with its value normalized to 18 decimals.
    - Example command: `NETWORK=base FEED=0xAddressOfExternal_uStETH_ETH_Feed DAPP_ID=YourDappId pnpm deploy:NormalizedApi3ReaderProxyV1`

2.  **Deploy `ProductApi3ReaderProxyV1` to calculate uStETH/USD**:
    - This step multiplies the normalized uStETH/ETH rate by the ETH/USD rate from the Api3 dAPI.
    - Input `PROXY1`: Address of the `NormalizedApi3ReaderProxyV1` instance deployed in step 1.
    - Input `PROXY2`: Address of the existing ETH/USD `IApi3ReaderProxy` dAPI.
    - Output: An `IApi3ReaderProxy` contract. This deployed instance of `ProductApi3ReaderProxyV1` reads uStETH/USD.
      - Calculation: `(uStETH/ETH) * (ETH/USD) = uStETH/USD`.
    - Example command: `NETWORK=base PROXY1=0xAddressOfDeployedNormalizedApi3ReaderProxyV1FromStep1 PROXY2=0xAddressOfApi3EthUsdDapi pnpm deploy:ProductApi3ReaderProxyV1`
      _(Note: Replace `0xAddressOfDeployedNormalizedApi3ReaderProxyV1FromStep1` with the actual address obtained from the deployment artifact of step 1)._

This scenario highlights how `NormalizedApi3ReaderProxyV1` serves as a crucial bridge, enabling dApps to integrate valuable data from external sources (that may not meet Api3 dAPI listing criteria or are simply outside the current offerings) and combine it with trusted Api3 dAPIs using the standard set of combinator tools.

When deploying a combinator that depends on another already deployed combinator, you will need the address of the prerequisite contract. You can find this address in the deployment artifact file (e.g., `deployments/<network_name>/<ContractName>_SomeHash.json`) generated in the previous step.

## Further Information

For detailed specifications of each combinator, including constructor arguments, public methods, and Natspec documentation, please consult the contract source code within this repository. Familiarity with the `IApi3ReaderProxy` interface from the `@api3/contracts` repository is also highly recommended for effective integration.
