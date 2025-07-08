import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { DeploymentsExtension } from 'hardhat-deploy/types';

import { getDeploymentName } from '../src';
import * as testUtils from '../test/test-utils';

export const CONTRACT_NAME = 'ProductApi3ReaderProxyV1';

const deployMockApi3ReaderProxyV1 = async (
  deployments: DeploymentsExtension,
  deployerAddress: string,
  dappId: string
) => {
  const { address } = await deployments.deploy('MockApi3ReaderProxyV1', {
    from: deployerAddress,
    args: [
      dappId,
      '2000000000000000000000', // A mock value (2000e18)
      Math.floor(Date.now() / 1000), // A mock timestamp
    ],
    log: true,
  });
  return address;
};

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getUnnamedAccounts, deployments, ethers, network, run } = hre;
  const { deploy, log } = deployments;

  const [deployerAddress] = await getUnnamedAccounts();
  if (!deployerAddress) {
    throw new Error('No deployer address found.');
  }
  log(`Deployer address: ${deployerAddress}`);

  const isLocalNetwork = network.name === 'hardhat' || network.name === 'localhost';

  const dappId = testUtils.generateRandomBytes32();
  const proxy1Address = isLocalNetwork
    ? await deployMockApi3ReaderProxyV1(deployments, deployerAddress, dappId)
    : process.env.PROXY1;
  if (!proxy1Address) {
    throw new Error('PROXY1 environment variable not set. Please provide the address of the first proxy contract.');
  }
  if (!ethers.isAddress(proxy1Address)) {
    throw new Error(`Invalid address provided for PROXY1: ${proxy1Address}`);
  }
  log(`Proxy 1 address: ${proxy1Address}`);

  // Sleep for 1 sec when deploying to local network in order to generate a different proxy address
  if (isLocalNetwork) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const proxy2Address = isLocalNetwork
    ? await deployMockApi3ReaderProxyV1(deployments, deployerAddress, dappId)
    : process.env.PROXY2;
  if (!proxy2Address) {
    throw new Error('PROXY2 environment variable not set. Please provide the address of the second proxy contract.');
  }
  if (!ethers.isAddress(proxy2Address)) {
    throw new Error(`Invalid address provided for PROXY2: ${proxy2Address}`);
  }
  log(`Proxy 2 address: ${proxy2Address}`);

  const confirmations = isLocalNetwork ? 1 : 5;
  log(`Deployment confirmations: ${confirmations}`);

  const constructorArgs = [proxy1Address, proxy2Address];
  const constructorArgTypes = ['address', 'address'];

  const deploymentName = getDeploymentName(CONTRACT_NAME, constructorArgTypes, constructorArgs);
  log(`Generated deterministic deployment name for this instance: ${deploymentName}`);

  const deployment = await deploy(deploymentName, {
    contract: CONTRACT_NAME,
    from: deployerAddress,
    args: constructorArgs,
    log: true,
    waitConfirmations: confirmations,
  });

  if (isLocalNetwork) {
    log('Skipping verification on local network.');
    return;
  }

  log(
    `Attempting verification of ${deploymentName} (contract type ${CONTRACT_NAME}) at ${deployment.address} (already waited for confirmations)...`
  );
  await run('verify:verify', {
    address: deployment.address,
    constructorArguments: deployment.args,
  });
};
module.exports.tags = [CONTRACT_NAME];
