import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { DeploymentsExtension } from 'hardhat-deploy/types';

import { getDeploymentName } from '../src';
import * as testUtils from '../test/test-utils';

export const CONTRACT_NAME = 'ScaledApi3FeedProxyV1';

const deployMockApi3ReaderProxyV1 = async (deployments: DeploymentsExtension, deployerAddress: string) => {
  const { address } = await deployments.deploy('MockApi3ReaderProxyV1', {
    from: deployerAddress,
    args: [
      testUtils.generateRandomBytes32(), // A mock dappId
      '2000000000000000000000', // A mock value (2000e18)
      Math.floor(Date.now() / 1000), // A mock timestamp
    ],
    log: true,
  });
  return address;
};

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getUnnamedAccounts, deployments, network, ethers, run } = hre;
  const { deploy, log } = deployments;

  const [deployerAddress] = await getUnnamedAccounts();
  if (!deployerAddress) {
    throw new Error('No deployer address found.');
  }
  log(`Deployer address: ${deployerAddress}`);

  if (!process.env.DECIMALS) {
    throw new Error('DECIMALS environment variable not set. Please provide the number of decimals to use.');
  }
  const decimals = Number.parseInt(process.env.DECIMALS, 10);
  log(`Decimals: ${decimals}`);

  const isLocalNetwork = network.name === 'hardhat' || network.name === 'localhost';

  const proxyAddress = isLocalNetwork
    ? await deployMockApi3ReaderProxyV1(deployments, deployerAddress)
    : process.env.PROXY;
  if (!proxyAddress) {
    throw new Error('PROXY environment variable not set. Please provide the address of the Api3ReaderProxy contract.');
  }
  if (!ethers.isAddress(proxyAddress)) {
    throw new Error(`Invalid address provided for PROXY: ${proxyAddress}`);
  }
  log(`Proxy address: ${proxyAddress}`);

  const confirmations = isLocalNetwork ? 1 : 5;
  log(`Deployment confirmations: ${confirmations}`);

  const constructorArgs = [proxyAddress, decimals];
  const constructorArgTypes = ['address', 'uint8'];

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
