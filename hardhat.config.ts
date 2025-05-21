import { hardhatConfig } from '@api3/contracts';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import type { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  etherscan: hardhatConfig.etherscan(),
  networks: hardhatConfig.networks(),
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
  sourcify: {
    enabled: true,
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
