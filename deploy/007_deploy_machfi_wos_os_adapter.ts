import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { getDeploymentName } from '../src';

export const CONTRACT_NAME = 'WOSApi3ReaderProxyV1';

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getUnnamedAccounts, run } = hre;
  const { deploy, log } = deployments;

  const [deployerAddress] = await getUnnamedAccounts();
  if (!deployerAddress) {
    throw new Error('No deployer address found.');
  }
  log(`Deployer address: ${deployerAddress}`);

  const constructorArgs = [] as any[];
  const constructorArgTypes = [] as any[];

  const deploymentName = getDeploymentName(CONTRACT_NAME, constructorArgTypes, constructorArgs);
  log(`Generated deterministic deployment name for this instance: ${deploymentName}`);

  const deployment = await deploy(deploymentName, {
    contract: CONTRACT_NAME,
    from: deployerAddress,
    args: constructorArgs,
    log: true,
  });

  log(`Deployed ${deploymentName} at address: ${deployment.address}`);

  log(
    `Attempting verification of ${deploymentName} (contract type ${CONTRACT_NAME}) at ${deployment.address} (already waited for confirmations)...`
  );
  await run('verify:verify', {
    address: deployment.address,
    constructorArguments: deployment.args,
  });
};

module.exports.tags = [CONTRACT_NAME];
