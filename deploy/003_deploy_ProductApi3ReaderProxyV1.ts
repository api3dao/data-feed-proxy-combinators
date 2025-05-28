import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { getDeploymentName } from '../src';

export const CONTRACT_NAME = 'ProductApi3ReaderProxyV1';

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getUnnamedAccounts, deployments, ethers, network, run } = hre;
  const { deploy, log } = deployments;

  const [deployerAddress] = await getUnnamedAccounts();
  if (!deployerAddress) {
    throw new Error('No deployer address found.');
  }
  log(`Deployer address: ${deployerAddress}`);

  const proxy1Address = process.env.PROXY1;
  if (!proxy1Address) {
    throw new Error('PROXY1 environment variable not set. Please provide the address of the first proxy contract.');
  }
  if (!ethers.isAddress(proxy1Address)) {
    throw new Error(`Invalid address provided for PROXY1: ${proxy1Address}`);
  }
  log(`Proxy 1 address: ${proxy1Address}`);

  const proxy2Address = process.env.PROXY2;
  if (!proxy2Address) {
    throw new Error('PROXY2 environment variable not set. Please provide the address of the second proxy contract.');
  }
  if (!ethers.isAddress(proxy2Address)) {
    throw new Error(`Invalid address provided for PROXY2: ${proxy2Address}`);
  }
  log(`Proxy 2 address: ${proxy2Address}`);

  const isLocalNetwork = network.name === 'hardhat' || network.name === 'localhost';

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
