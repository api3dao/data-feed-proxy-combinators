import { isAddress } from 'ethers';

import type { Environment } from '../rocketh/config.js';
import { artifacts, deployScript } from '../rocketh/deploy.js';
import { isLocalNetwork, verifyDeployment } from '../rocketh/utils.js';
import { getDeploymentName } from '../src/index.js';

export const CONTRACT_NAME = 'InverseApi3ReaderProxyV1';

const deployMockApi3ReaderProxyV1 = async (env: Environment) => {
  const { address } = await env.deploy('MockApi3ReaderProxyV1', {
    account: env.namedAccounts.deployer,
    artifact: artifacts.MockApi3ReaderProxyV1,
    args: [
      2000n * 10n ** 18n, // A mock value (2000e18)
      Math.floor(Date.now() / 1000), // A mock timestamp
    ],
  });
  return address;
};

// eslint-disable-next-line import/no-default-export
export default deployScript(
  async (env) => {
    const { deployer } = env.namedAccounts;
    env.showMessage(`Deployer address: ${deployer}`);

    const proxyAddress = isLocalNetwork(env) ? await deployMockApi3ReaderProxyV1(env) : process.env.PROXY;
    if (!proxyAddress) {
      throw new Error('PROXY environment variable not set. Please provide the address of the proxy contract.');
    }
    if (!isAddress(proxyAddress)) {
      throw new Error(`Invalid address provided for PROXY: ${proxyAddress}`);
    }
    env.showMessage(`Proxy address: ${proxyAddress}`);

    const constructorArgs: [`0x${string}`] = [proxyAddress as `0x${string}`];
    const constructorArgTypes = ['address'];

    const deploymentName = getDeploymentName(CONTRACT_NAME, constructorArgTypes, constructorArgs);
    env.showMessage(`Generated deterministic deployment name for this instance: ${deploymentName}`);

    const deployment = await env.deploy(deploymentName, {
      account: deployer,
      artifact: artifacts.InverseApi3ReaderProxyV1,
      args: constructorArgs,
    });

    await verifyDeployment(env, `${deploymentName} (contract type ${CONTRACT_NAME})`, deployment, constructorArgs);
  },
  { tags: [CONTRACT_NAME] }
);
