import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { DeploymentsExtension } from 'hardhat-deploy/types';

import { getDeploymentName } from '../src';

export const CONTRACT_NAME = 'NormalizedApi3ReaderProxyV1';

const deployTestFeed = async (deployments: DeploymentsExtension, deployerAddress: string) => {
  const { address: scaledApi3FeedProxyV1Address } = await deployments.get('ScaledApi3FeedProxyV1').catch(async () => {
    return deployments.deploy('ScaledApi3FeedProxyV1', {
      from: deployerAddress,
      args: ['0x5b0cf2b36a65a6BB085D501B971e4c102B9Cd473', 8],
      log: true,
    });
  });
  return scaledApi3FeedProxyV1Address;
};

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getUnnamedAccounts, deployments, network, ethers, run } = hre;
  const { deploy, log } = deployments;

  const [deployerAddress] = await getUnnamedAccounts();
  if (!deployerAddress) {
    throw new Error('No deployer address found.');
  }
  log(`Deployer address: ${deployerAddress}`);

  const feedAddress =
    network.name === 'hardhat' ? await deployTestFeed(deployments, deployerAddress) : process.env.FEED;
  if (!feedAddress) {
    throw new Error(
      'FEED environment variable not set. Please provide the address of the AggregatorV2V3Interface contract.'
    );
  }
  if (!ethers.isAddress(feedAddress)) {
    throw new Error(`Invalid address provided for FEED: ${feedAddress}`);
  }
  log(`Feed address: ${feedAddress}`);

  const isLocalNetwork = network.name === 'hardhat' || network.name === 'localhost';

  const confirmations = isLocalNetwork ? 1 : 5;
  log(`Deployment confirmations: ${confirmations}`);

  const constructorArgs = [feedAddress];
  const constructorArgTypes = ['address'];

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
