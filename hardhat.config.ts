import { hardhatConfig } from '@api3/contracts';
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';
import 'dotenv/config';
import { defineConfig } from 'hardhat/config';
import hardhatDeploy from 'hardhat-deploy';

// Hardhat 2 forced evmVersion to "paris" whenever it was not set. Hardhat 3 leaves the choice to
// solc, which picks a newer default for 0.8.27, so it is pinned to keep the bytecode unchanged.
const compilers = [
  {
    version: '0.8.17',
    settings: { evmVersion: 'paris', optimizer: { enabled: true, runs: 1000 } },
  },
  {
    version: '0.8.27',
    settings: { evmVersion: 'paris', optimizer: { enabled: true, runs: 1000 } },
  },
];

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [hardhatToolboxMochaEthers, hardhatDeploy],
  solidity: {
    // "hardhat deploy" and "verifyContract()" both default to the "production" profile, while
    // "hardhat build" defaults to "default". Both profiles must produce identical bytecode.
    profiles: {
      default: { compilers },
      production: { compilers },
    },
    // Hardhat 2 generated types for the @api3/contracts interfaces the contracts import, and the
    // package exports them. Hardhat 3 builds npm sources only when they are listed here.
    npmFilesToBuild: [
      '@api3/contracts/api3-server-v1/proxies/interfaces/IApi3ReaderProxyV1.sol',
      '@api3/contracts/interfaces/IApi3ReaderProxy.sol',
    ],
  },
  networks: hardhatConfig.v3.networks(),
  chainDescriptors: hardhatConfig.v3.chainDescriptors(),
  verify: hardhatConfig.v3.verify(),
  typechain: { outDir: 'typechain-types' },
  // rocketh/deploy.ts reads these, and the deploy scripts pass them to env.deploy.
  generateTypedArtifacts: { destinations: [{ folder: './generated', mode: 'typescript' }] },
  test: {
    mocha: { parallel: true },
  },
  coverage: {
    // These match user source names, not directory prefixes.
    skipFiles: ['contracts/test/**', 'contracts/vendor/**'],
  },
});
