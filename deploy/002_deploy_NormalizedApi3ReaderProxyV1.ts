import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { DeploymentsExtension } from 'hardhat-deploy/types';

import { getDeploymentName } from '../src';
import * as testUtils from '../test/test-utils';

export const CONTRACT_NAME = 'NormalizedApi3ReaderProxyV1';

const deployMockAggregatorV2V3 = async (deployments: DeploymentsExtension, deployerAddress: string) => {
  const { address } = await deployments.deploy('MockAggregatorV2V3', {
    from: deployerAddress,
    args: [
      8, // A mock decimals
      '25000000', // A mock value (0.25e8)
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

  const isLocalNetwork = network.name === 'hardhat' || network.name === 'localhost';

  const feedAddress = isLocalNetwork ? await deployMockAggregatorV2V3(deployments, deployerAddress) : process.env.FEED;
  if (!feedAddress) {
    throw new Error(
      'FEED environment variable not set. Please provide the address of the AggregatorV2V3Interface contract.'
    );
  }
  if (!ethers.isAddress(feedAddress)) {
    throw new Error(`Invalid address provided for FEED: ${feedAddress}`);
  }
  log(`Feed address: ${feedAddress}`);

  const dappId = isLocalNetwork ? testUtils.generateRandomBytes32() : process.env.DAPP_ID;
  if (!dappId) {
    throw new Error('DAPP_ID environment variable not set. Please provide the dApp ID.');
  }
  if (!ethers.isHexString(dappId, 32)) {
    throw new Error(`Invalid dApp ID provided: ${dappId}`);
  }
  log(`dApp ID: ${dappId}`);

  const confirmations = isLocalNetwork ? 1 : 5;
  log(`Deployment confirmations: ${confirmations}`);

  const constructorArgs = [feedAddress, dappId];
  const constructorArgTypes = ['address', 'uint256'];

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
