import { go } from '@api3/commons';
import { BrowserProvider, isAddress } from 'ethers';

import type { Environment } from '../rocketh/config.js';
import { artifacts, deployScript } from '../rocketh/deploy.js';
import { isLocalNetwork, verifyDeployment } from '../rocketh/utils.js';
import { getDeploymentName, IApi3ReaderProxyV1__factory } from '../src/index.js';

export const CONTRACT_NAME = 'ProductApi3ReaderProxyV1';

const deployMockApi3ReaderProxyV1 = async (env: Environment, name: string) => {
  const { address } = await env.deploy(name, {
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

    const proxy1Address = isLocalNetwork(env)
      ? await deployMockApi3ReaderProxyV1(env, 'MockApi3ReaderProxyV1_1')
      : process.env.PROXY1;
    if (!proxy1Address) {
      throw new Error('PROXY1 environment variable not set. Please provide the address of the first proxy contract.');
    }
    if (!isAddress(proxy1Address)) {
      throw new Error(`Invalid address provided for PROXY1: ${proxy1Address}`);
    }
    env.showMessage(`Proxy 1 address: ${proxy1Address}`);

    // Sleep for 1 sec when deploying to local network in order to generate a different proxy address
    if (isLocalNetwork(env)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const proxy2Address = isLocalNetwork(env)
      ? await deployMockApi3ReaderProxyV1(env, 'MockApi3ReaderProxyV1_2')
      : process.env.PROXY2;
    if (!proxy2Address) {
      throw new Error('PROXY2 environment variable not set. Please provide the address of the second proxy contract.');
    }
    if (!isAddress(proxy2Address)) {
      throw new Error(`Invalid address provided for PROXY2: ${proxy2Address}`);
    }
    env.showMessage(`Proxy 2 address: ${proxy2Address}`);

    if (!isLocalNetwork(env)) {
      let dappId1, dappId2;
      const provider = new BrowserProvider(env.network.provider);
      const proxy1 = IApi3ReaderProxyV1__factory.connect(proxy1Address, provider);
      const proxy2 = IApi3ReaderProxyV1__factory.connect(proxy2Address, provider);

      const goDappId1 = await go(() => proxy1.dappId());
      if (goDappId1.success) {
        dappId1 = goDappId1.data;
        env.showMessage(`Proxy 1 dappId: ${dappId1}`);
      } else {
        env.showMessage('Proxy 1 does not have a dappId');
      }

      const goDappId2 = await go(() => proxy2.dappId());
      if (goDappId2.success) {
        dappId2 = goDappId2.data;
        env.showMessage(`Proxy 2 dappId: ${dappId2}`);
      } else {
        env.showMessage('Proxy 2 does not have a dappId');
      }

      if (dappId1 && dappId2 && dappId1 !== dappId2) {
        throw new Error(`dApp IDs of PROXY1 (${dappId1}) and PROXY2 (${dappId2}) do not match.`);
      }
    }

    const constructorArgs: [`0x${string}`, `0x${string}`] = [
      proxy1Address as `0x${string}`,
      proxy2Address as `0x${string}`,
    ];
    const constructorArgTypes = ['address', 'address'];

    const deploymentName = getDeploymentName(CONTRACT_NAME, constructorArgTypes, constructorArgs);
    env.showMessage(`Generated deterministic deployment name for this instance: ${deploymentName}`);

    const deployment = await env.deploy(deploymentName, {
      account: deployer,
      artifact: artifacts.ProductApi3ReaderProxyV1,
      args: constructorArgs,
    });

    await verifyDeployment(env, `${deploymentName} (contract type ${CONTRACT_NAME})`, deployment, constructorArgs);
  },
  { tags: [CONTRACT_NAME] }
);
