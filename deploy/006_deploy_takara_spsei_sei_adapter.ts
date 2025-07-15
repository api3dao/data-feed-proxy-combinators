import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { getDeploymentName } from '../src';

export const CONTRACT_NAME = 'SpSEIApi3ReaderProxyV1';

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
  // Successfully verified contract SpSEIApi3ReaderProxyV1 on the block explorer.
  // https://seitrace.com/address/0x1a0F087e0A4084978BfCe0B882579fae52C7909C#code

  // NETWORK=sei_pacific_1 PROXY1=0x1a0F087e0A4084978BfCe0B882579fae52C7909C PROXY2=0x0f6a4D320c29512476374EF142F1e70aBe6D88F3 pnpm deploy:ProductApi3ReaderProxyV1
};

module.exports.tags = [CONTRACT_NAME];
