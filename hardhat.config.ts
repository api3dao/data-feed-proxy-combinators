import { hardhatConfig } from '@api3/contracts';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-verify';
import 'hardhat-deploy';
import 'dotenv/config';
import type { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  // NOTE: According to https://docs.sei.io/evm/evm-verify-contracts#config-file
  etherscan: {
    ...hardhatConfig.etherscan(),
    apiKey: {
      sei_pacific_1: 'dummy',
    },
    customChains: [
      {
        network: 'sei_pacific_1',
        chainId: 1329,
        urls: {
          apiURL: 'https://seitrace.com/pacific-1/api',
          browserURL: 'https://seitrace.com',
        },
      },
    ],
  },
  networks: {
    ...hardhatConfig.networks(),
    sei_pacific_1: {
      url: 'https://evm-rpc.sei-apis.com',
      chainId: 1329,
      accounts: { mnemonic: process.env.MNEMONIC ?? '' },
      gas: 'auto',
      gasPrice: 'auto',
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: '0.8.27',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
