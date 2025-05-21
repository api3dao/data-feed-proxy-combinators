# @api3/data-feed-proxy-combinators

> For general information about API3 data feeds, dAPIs, and other services, end users are recommended to refer to the [official API3 dApp documentation](https://docs.api3.org/dapps/).

## What is this?

This repository contains a suite of utility smart contracts designed to work with and extend the functionality of API3 data feeds. These contracts, often referred to as "proxy combinators" or "adapters," act as wrappers around existing data feeds, allowing dApp developers to transform, derive, or normalize data feed values to suit their specific application needs.

The content in this directory provides insights into these combinator contracts, their design, and their intended use cases. For low-level documentation about functionality and usage, refer to the Natspec docstrings and the implementation of the respective contracts.

## Overview

API3 provides reliable, first-party oracle data directly to smart contracts, primarily through dAPIs (decentralized APIs) which are continuously updated data feeds. While these dAPIs serve a wide array of use cases, dApps occasionally require data in a format or derivation not directly offered by a base dAPI. For instance, a dApp might need an inverted price (e.g., USD/ETH from an ETH/USD dAPI), a value scaled to different decimal precision, or a data point derived from combining multiple existing dAPIs (e.g., BTC/ETH from a BTC/USD dAPI and an ETH/USD dAPI).

Manually implementing such logic within each dApp can be repetitive, error-prone, and gas-intensive. Furthermore, requiring a new, dedicated first-party oracle deployment for every minor data variation is not scalable. Data Feed Proxy Combinators address these challenges by providing **standardized and reusable smart contract solutions** for adapting data feeds on-chain. While a specific instance of a combinator proxy is typically deployed to serve a particular dApp's needs (often in conjunction with its dedicated underlying data feed proxy), these combinator contracts offer a common, audited approach to performing such transformations, promoting code reuse and reliability across the ecosystem.

### Core Capabilities

These combinator contracts are designed to be modular and composable, typically taking the address(es) of underlying feed(s) and any necessary operational parameters (like scaling factors) in their constructors. They offer several key capabilities:

- **Transformation:** Modify the value or metadata of a single underlying data feed.
  - **`InverseApi3ReaderProxyV1`**: Takes an underlying `IApi3ReaderProxyV1` (e.g., ETH/USD) and exposes an interface where `read()` returns the inverse of the underlying feed's value (e.g., `1 / (ETH/USD value)` to represent USD/ETH).
  - **`ScaledApi3FeedProxyV1`**: This contract reads from an underlying `IApi3ReaderProxyV1` and scales its value to a specified number of decimal places. However, it **exposes** the Chainlink `AggregatorV3Interface` (and `AggregatorV2V3Interface`). Its primary purpose is to make an API3 data feed's value, adjusted to a different precision, consumable by systems expecting a Chainlink-compatible interface.
- **Derivation/Combination:** Create a new logical data stream by performing operations on one or more underlying feeds.
  - **`ProductApi3ReaderProxyV1`**: Takes two underlying `IApi3ReaderProxy` instances (e.g., Feed A and Feed B). Its `read()` method returns the product of the values read from Feed A and Feed B. This contract itself implements `IApi3ReaderProxy`. Natspec would emphasize the importance of managing decimal places of the input feeds to ensure the product's decimal interpretation is correct, and potential overflow scenarios.
- **Normalization/Adaptation:** Wrap data sources that may not strictly adhere to the standard `IApi3ReaderProxyV1` interface, making them compatible with systems expecting this interface.
  - **`NormalizedApi3ReaderProxyV1`**: This contract reads from an external data feed, typically one exposing a Chainlink-compatible `AggregatorV3Interface` (or `AggregatorV2V3Interface`). It then **exposes** the standard API3 `IApi3ReaderProxy` interface. Its purpose is to allow dApps expecting an API3 feed to consume data from sources like Chainlink feeds, often used as part of a migration strategy (see the Migrate from Chainlink guide). Its constructor would take the address of the external feed. Natspec would explain how it translates the external feed's data structure (e.g., `latestRoundData`) and timestamping (if available) into API3's `(int224 value, uint32 timestamp)` format.
- **Composability:** The output of one combinator proxy can often serve as the input for another. This allows developers to chain multiple combinators together to create complex data transformation pipelines on-chain. For example, one could take a base feed, use `ScaledApi3FeedProxyV1` to adjust its decimals, then feed the output into an `InverseApi3ReaderProxyV1`.
  - _Example 1 (API3 to API3):_ An `IApi3ReaderProxy` could be wrapped by `InverseApi3ReaderProxyV1` (outputting `IApi3ReaderProxy`), which is then wrapped by another `ProductApi3ReaderProxyV1` (also outputting `IApi3ReaderProxy`).
  - _Example 2 (Mixed Interfaces):_ An `IApi3ReaderProxy` could be wrapped by `ScaledApi3FeedProxyV1` (outputting `AggregatorV3Interface`). Conversely, a Chainlink feed (`AggregatorV3Interface`) could be wrapped by `NormalizedApi3ReaderProxyV1` (outputting `IApi3ReaderProxy`). This highlights the adapter nature of some combinators.

A key design principle is that these combinator proxies either consume and expose the API3 `IApi3ReaderProxy` interface (the standard way to read dAPIs), or act as adapters between `IApi3ReaderProxy` and other common data feed interfaces like Chainlink's `AggregatorV3Interface`. This ensures that dApps can integrate these combinators effectively, whether they are working purely within the API3 ecosystem or bridging data from/to other oracle systems.

### Benefits

Utilizing Data Feed Proxy Combinators offers several advantages:

- **Enhanced Flexibility:** Empowers dApp developers to tailor data consumption to their precise needs without altering their core logic significantly.
- **Increased Efficiency:** Reduces the need for redundant on-chain calculations within individual dApps and avoids the operational overhead of requesting numerous slightly varied dAPIs from API providers.
- **Improved Scalability:** Allows the API3 ecosystem to serve a broader range of data requirements by leveraging existing data feeds in new ways.
- **Standardization:** Provides a common set of tools for common data feed manipulations, promoting code reuse and reliability.
- **Simplified Integration:** By adhering to standard interfaces, these combinators lower the barrier for dApps to access derived or transformed data.

## Intended Use Cases

Data Feed Proxy Combinators are particularly useful in scenarios such as:

- **Accessing Inverse Feeds:** When a dApp requires a price quoted as `QUOTE/BASE` but the available oracle feed provides `BASE/QUOTE` (e.g., using `InverseApi3ReaderProxyV1`).
- **Decimal Precision Adjustment:** Matching a data feed's precision to a dApp's internal numerical representation or the requirements of another protocol (e.g., using `ScaledApi3FeedProxyV1` to convert an 8-decimal feed to an 18-decimal representation).
- **Calculating Derived Values:**
  - Cross-Rates: Deriving exchange rates like EUR/JPY from EUR/USD and USD/JPY feeds. This might involve using `InverseApi3ReaderProxyV1` on one feed and then `ProductApi3ReaderProxyV1` with the result and the other feed.
  - Other Products: Calculating values that are a product of two reported data points.
- **Adapting External Data Sources:** Integrating data from non-standard on-chain sources (e.g., other oracle networks via `NormalizedApi3ReaderProxyV1`) into systems expecting an API3-compatible feed interface. This is particularly relevant when migrating from other oracle providers or when a specific feed is only available through a non-API3 interface.
- **Building Complex Financial Instruments:** Creating structured products or derivatives whose values depend on mathematical combinations or transformations of underlying asset prices.
- **Gas Optimization for Multiple Readers:** If multiple contracts need the same transformed version of a feed, deploying a single combinator proxy can be more gas-efficient than each contract performing the transformation independently.

## Design Philosophy

The development of these combinators is guided by several principles:

- **Modularity:** Each contract aims to perform a specific, well-defined transformation or combination.
- **Security:** The combinators are designed to be simple and robust. Their security relies on the correctness of their own logic and, crucially, on the security and reliability of the underlying API3 data feeds they consume. They aim to introduce minimal additional trust assumptions.
- **Gas Awareness:** While providing on-chain data manipulation, efforts are made to ensure the implementations are as gas-efficient as reasonably possible for their intended operations.
- **Clarity and Reusability:** Contracts are written to be understandable and generic enough to be applied in a variety of dApp contexts, promoting best practices in data feed consumption.

## Further Information

For detailed, low-level documentation about the specific functionality, constructor arguments, public methods, and Natspec comments, please refer to the source code of the respective contracts within this repository. Understanding the underlying `IApi3ReaderProxy` interface (typically `interface IApi3ReaderProxy`) from the main `@api3/contracts` repository will also be beneficial. For more information on how dApps interact with API3 data feeds, consult the API3 dApp documentation.
