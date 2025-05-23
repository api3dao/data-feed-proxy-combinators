# @api3/data-feed-proxy-combinators

## Overview

> For general information about Api3 data feeds, dAPIs, and other services, end users are recommended to refer to the [official Api3 dApp documentation](https://docs.api3.org/dapps/).

Api3 delivers reliable, first-party oracle data via dAPIs (continuously updated data feeds). However, dApps often require this data in formats or derivations not directly provided by a base dAPI, such as inverted prices (e.g., USD/ETH from ETH/USD), scaled values, or new feeds derived from combining multiple dAPIs (e.g., BTC/ETH from BTC/USD and ETH/USD). Data Feed Proxy Combinators address this as (soon-to-be) audited, standardized, and reusable smart contracts. These combinators operate on top of existing `IApi3ReaderProxy` contracts, enabling developers to combine them or transform their output to read data in different formats or derive new data feeds on-chain. This approach avoids repetitive, error-prone, and gas-intensive custom logic within individual dApps and the impracticality of deploying new oracles for minor data variations, thereby enhancing code reuse and reliability.
Being documented, easily usable, and officially recommended by Api3, they offer a trusted and straightforward way for developers to implement these common data transformations.

### Core Capabilities

Data Feed Proxy Combinators provide modular and composable smart contracts for on-chain data feed adaptation. They typically take the address(es) of underlying feed(s) and operational parameters (like scaling factors) in their constructors. Key contract implementations include:

- **`InverseApi3ReaderProxyV1`**: Takes an underlying `IApi3ReaderProxy` (e.g., ETH/USD). Its `read()` method returns the inverse of the underlying feed's value (e.g., `1 / (ETH/USD value)` to represent USD/ETH), exposing an `IApi3ReaderProxy` interface.
- **`ScaledApi3FeedProxyV1`**: Reads from an underlying `IApi3ReaderProxy`, scales its value to a specified number of decimal places, and exposes the Chainlink `AggregatorV3Interface` (and `AggregatorV2V3Interface`). This makes an Api3 data feed, with adjusted precision, consumable by systems expecting a Chainlink-compatible interface.
- **`ProductApi3ReaderProxyV1`**: Takes two underlying `IApi3ReaderProxy` instances. Its `read()` method returns the product of their values, implementing the `IApi3ReaderProxy` interface.
- **`NormalizedApi3ReaderProxyV1`**: Reads from an external data feed (typically Chainlink-compatible `AggregatorV3Interface`) and exposes the standard Api3 `IApi3ReaderProxy` interface. This allows dApps expecting an Api3 feed to consume data from other sources, useful for migration.

These combinators either consume and expose the Api3 `IApi3ReaderProxy` interface or act as adapters to/from other interfaces like Chainlink's `AggregatorV3Interface`. This facilitates integration within the Api3 ecosystem or when bridging with other oracle systems. The output of one combinator can often serve as input for another, enabling complex data transformation pipelines.

## Further Information

For detailed specifications of each combinator, including constructor arguments, public methods, and Natspec documentation, please consult the contract source code within this repository. Familiarity with the `IApi3ReaderProxy` interface from the `@api3/contracts` repository is also highly recommended for effective integration.
