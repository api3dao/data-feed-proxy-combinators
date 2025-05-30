# @api3/data-feed-proxy-combinators

## Overview

> For general information about Api3 data feeds, dAPIs, and other services, end users are recommended to refer to the [official Api3 dApp documentation](https://docs.api3.org/dapps/).

Api3 delivers reliable, first-party oracle data via dAPIs (continuously updated data feeds). However, dApps often require this data in formats or derivations not directly provided by a base dAPI, such as inverted prices (e.g., USD/ETH from ETH/USD), scaled values, or new feeds derived from combining multiple dAPIs (e.g., BTC/ETH from BTC/USD and ETH/USD). Data Feed Proxy Combinators address this as (soon-to-be) audited, standardized, and reusable smart contracts. These combinators operate on top of existing `IApi3ReaderProxy` contracts, enabling developers to combine them or transform their output to read data in different formats or derive new data feeds on-chain. This approach avoids repetitive, error-prone, and gas-intensive custom logic within individual dApps and the impracticality of deploying new oracles for minor data variations, thereby enhancing code reuse and reliability.
Being documented, easily usable, and officially recommended by Api3, they offer a trusted and straightforward way for developers to implement these common data transformations.

⚠️ Important Note: These combinator proxies are designed as lightweight wrappers. They do not perform additional validation on the data (e.g., value sanity checks or timestamp verification) returned by the underlying dAPIs or external feeds. The responsibility for data quality and timeliness rests with the source oracle or feed provider. Furthermore, these contracts are provided "as is" without any warranty, and there is no financial coverage or insurance associated with their use.

### Core Capabilities

Data Feed Proxy Combinators provide modular and composable smart contracts for on-chain data feed adaptation. They typically take the address(es) of underlying feed(s) and operational parameters (like scaling factors) in their constructors. Key contract implementations include:

- **`InverseApi3ReaderProxyV1`**: Takes an underlying `IApi3ReaderProxy` (e.g., ETH/USD). Its `read()` method returns the inverse of the underlying feed's value (e.g., `1 / (ETH/USD value)` to represent USD/ETH), exposing an `IApi3ReaderProxy` interface.
- **`ScaledApi3FeedProxyV1`**: Reads from an underlying `IApi3ReaderProxy`, scales its value to a specified number of decimal places, and exposes the Chainlink `AggregatorV3Interface` (and `AggregatorV2V3Interface`). This makes an Api3 data feed, with adjusted precision, consumable by systems expecting a Chainlink-compatible interface with arbitrary decimals.
- **`ProductApi3ReaderProxyV1`**: Takes two underlying `IApi3ReaderProxy` instances. Its `read()` method returns the product of their values, implementing the `IApi3ReaderProxy` interface.
- **`NormalizedApi3ReaderProxyV1`**: Reads from an external data feed implementing the Chainlink-compatible `AggregatorV2V3Interface` and exposes the standard Api3 `IApi3ReaderProxy` interface. This allows dApps expecting an Api3 feed to consume data from other sources, useful for migration.

These combinators either consume and expose the Api3 `IApi3ReaderProxy` interface or act as adapters to/from other interfaces like Chainlink's `AggregatorV3Interface`. This facilitates integration within the Api3 ecosystem or when bridging with other oracle systems. The output of one combinator can often serve as input for another, enabling complex data transformation pipelines.

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
  - `FEED`: Address of the external data feed (e.g., a Chainlink `AggregatorV3Interface` compatible feed).
  - Example:
    ```bash
    NETWORK=polygon-mainnet FEED=0xExternalFeedAddress pnpm deploy:NormalizedApi3ReaderProxyV1
    ```

- **`ProductApi3ReaderProxyV1`**:

  - `NETWORK`: Target network name.
  - `PROXY1`: Address of the first `IApi3ReaderProxy` contract.
  - `PROXY2`: Address of the second `IApi3ReaderProxy` contract.
  - Example:
    ```bash
    NETWORK=arbitrum-mainnet PROXY1=0xProxy1Address PROXY2=0xProxy2Address pnpm deploy:ProductApi3ReaderProxyV1
    ```

- **`ScaledApi3FeedProxyV1`**:
  - `NETWORK`: Target network name.
  - `PROXY`: Address of the underlying `IApi3ReaderProxy` contract.
  - `DECIMALS`: The desired number of decimals for the scaled output.
  - Example:
    ```bash
    NETWORK=base-mainnet PROXY=0xUnderlyingProxyAddress DECIMALS=8 pnpm deploy:ScaledApi3FeedProxyV1
    ```

_Note: The specific `pnpm deploy:<ContractName>` scripts for each combinator are defined in the `package.json` file._

**Deployment Artifacts**: After deployment, contract artifacts (including ABI and deployed address) are saved in the `deployments/<network_name>/` directory.
For example, deploying `InverseApi3ReaderProxyV1` to the `ethereum-sepolia-testnet` network would create an artifact file like `deployments/ethereum-sepolia-testnet/InverseApi3ReaderProxyV1_SomeHash.json`. The `_SomeHash` part is derived from the constructor arguments, allowing multiple instances of the same contract with different configurations to be deployed and tracked.
These artifact files contain the deployed contract address, ABI, and the constructor arguments used for deployment (look for the `"args"` array in the JSON file). This information is crucial for integration and manual verification if needed.

**Contract Verification**:
The deployment scripts automatically attempt to verify the contract on the appropriate block explorer (e.g., Etherscan for Ethereum networks, Polygonscan for Polygon) after a successful deployment. This process uses the API keys (e.g., `ETHERSCAN_API_KEY_ETHEREUM_SEPOLIA_TESTNET`, `ETHERSCAN_API_KEY_POLYGON_MAINNET`) configured in your `.env` file, as described in "### 2. Environment Setup".
If verification fails during the deployment (e.g., due to network latency or an explorer API issue), you can simply re-run the exact same deployment command. `hardhat-deploy` is idempotent; it will detect that the contract is already deployed with the same arguments and bytecode, skip the deployment step, and only re-attempt the verification.

### 4. Combining Contracts (Advanced Usage)

The true power of these combinators is realized when they are chained together. The deployed address of one combinator contract can serve as an input (a constructor argument, typically an `IApi3ReaderProxy` or `AggregatorV3Interface` address) for another. This allows you to build sophisticated data transformation pipelines tailored to your dApp's specific needs.

Below are some common scenarios illustrating how you can combine these proxies:

**Scenario 1: Inverting and Scaling a dAPI**

Imagine your dApp requires a USD/ETH price feed with 8 decimal places, but the available API3 dAPI provides ETH/USD with 18 decimals.

1.  **Deploy `InverseApi3ReaderProxyV1`**:

    - Input `PROXY`: Address of the ETH/USD `IApi3ReaderProxy` dAPI.
    - Output: An `IApi3ReaderProxy` contract (`InverseProxy_ETHUSD`) that reads USD/ETH.
    - Example command: `NETWORK=your_network PROXY=0xAddressOfEthUsdDapi pnpm deploy:InverseApi3ReaderProxyV1`

2.  **Deploy `ScaledApi3FeedProxyV1`**:
    - Input `PROXY`: Address of `InverseProxy_ETHUSD` (from step 1).
    - Input `DECIMALS`: `8`.
    - Output: An `AggregatorV3Interface` contract that reads USD/ETH scaled to 8 decimals.
    - Example command: `NETWORK=your_network PROXY=0xAddressOfInverseProxyEthUsd DECIMALS=8 pnpm deploy:ScaledApi3FeedProxyV1`

**Scenario 2: Creating a Cross-Currency Pair (e.g., BTC/ETH) and Adapting its Interface**

Suppose your dApp needs a BTC/ETH price feed, and you have access to BTC/USD and ETH/USD dAPIs. You also want the final feed to be Chainlink-compatible.

1.  **Deploy `InverseApi3ReaderProxyV1` for ETH/USD**:

    - Input `PROXY`: Address of the ETH/USD `IApi3ReaderProxy` dAPI.
    - Output: An `IApi3ReaderProxy` contract (`InverseProxy_ETHUSD`) that reads USD/ETH.

2.  **Deploy `ProductApi3ReaderProxyV1`**:

    - Input `PROXY1`: Address of the BTC/USD `IApi3ReaderProxy` dAPI.
    - Input `PROXY2`: Address of `InverseProxy_ETHUSD` (from step 1).
    - Output: An `IApi3ReaderProxy` contract (`ProductProxy_BTCETH`) that reads BTC/ETH (calculated as BTC/USD \* USD/ETH).

3.  **Deploy `ScaledApi3FeedProxyV1` (Optional, for interface adaptation and scaling)**:
    - Input `PROXY`: Address of `ProductProxy_BTCETH` (from step 2).
    - Input `DECIMALS`: Desired decimals (e.g., `8` or `18`).
    - Output: An `AggregatorV3Interface` contract providing the BTC/ETH price, compatible with systems expecting a Chainlink feed.

**Scenario 3: Normalizing an External Feed and Then Inverting It**

Your dApp wants to use an external (e.g., Chainlink) EUR/USD feed but requires it as USD/EUR and prefers to interact with it via the API3 `IApi3ReaderProxy` interface.

1.  **Deploy `NormalizedApi3ReaderProxyV1`**:

    - Input `FEED`: Address of the external EUR/USD `AggregatorV3Interface` feed.
    - Output: An `IApi3ReaderProxy` contract (`NormalizedProxy_EURUSD`) that reads EUR/USD.

2.  **Deploy `InverseApi3ReaderProxyV1`**:
    - Input `PROXY`: Address of `NormalizedProxy_EURUSD` (from step 1).
    - Output: An `IApi3ReaderProxy` contract that reads USD/EUR.

When deploying a combinator that depends on another already deployed combinator, you will need the address of the prerequisite contract. You can find this address in the deployment artifact file (e.g., `deployments/<network_name>/<ContractName>_SomeHash.json`) generated in the previous step.

## Further Information

For detailed specifications of each combinator, including constructor arguments, public methods, and Natspec documentation, please consult the contract source code within this repository. Familiarity with the `IApi3ReaderProxy` interface from the `@api3/contracts` repository is also highly recommended for effective integration.
