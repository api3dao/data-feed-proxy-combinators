import { isAddress } from 'ethers';

import type { Environment } from '../rocketh/config.js';
import { artifacts, deployScript } from '../rocketh/deploy.js';
import { isLocalNetwork, verifyDeployment } from '../rocketh/utils.js';
import { getDeploymentName } from '../src/index.js';

export const CONTRACT_NAME = 'NormalizedApi3ReaderProxyV1';

const deployMockAggregatorV2V3 = async (env: Environment) => {
  const { address } = await env.deploy('MockAggregatorV2V3', {
    account: env.namedAccounts.deployer,
    artifact: artifacts.MockAggregatorV2V3,
    args: [
      8, // A mock decimals
      25_000_000n, // A mock value (0.25e8)
      BigInt(Math.floor(Date.now() / 1000)), // A mock timestamp
    ],
  });
  return address;
};

// eslint-disable-next-line import/no-default-export
export default deployScript(
  async (env) => {
    const { deployer } = env.namedAccounts;
    env.showMessage(`Deployer address: ${deployer}`);

    const feedAddress = isLocalNetwork(env) ? await deployMockAggregatorV2V3(env) : process.env.FEED;
    if (!feedAddress) {
      throw new Error(
        'FEED environment variable not set. Please provide the address of the AggregatorV2V3Interface contract.'
      );
    }
    if (!isAddress(feedAddress)) {
      throw new Error(`Invalid address provided for FEED: ${feedAddress}`);
    }
    env.showMessage(`Feed address: ${feedAddress}`);

    const constructorArgs: [`0x${string}`] = [feedAddress as `0x${string}`];
    const constructorArgTypes = ['address'];

    const deploymentName = getDeploymentName(CONTRACT_NAME, constructorArgTypes, constructorArgs);
    env.showMessage(`Generated deterministic deployment name for this instance: ${deploymentName}`);

    const deployment = await env.deploy(deploymentName, {
      account: deployer,
      artifact: artifacts.NormalizedApi3ReaderProxyV1,
      args: constructorArgs,
    });

    await verifyDeployment(env, `${deploymentName} (contract type ${CONTRACT_NAME})`, deployment, constructorArgs);
  },
  { tags: [CONTRACT_NAME] }
);
