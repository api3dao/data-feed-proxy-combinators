import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { getDeploymentName } from '../src';

export const CONTRACT_NAME = 'InverseApi3ReaderProxyV1';

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getUnnamedAccounts, deployments, ethers, network, run } = hre;
  const { deploy, log } = deployments;

  const [deployerAddress] = await getUnnamedAccounts();
  if (!deployerAddress) {
    throw new Error('No deployer address found.');
  }
  log(`Deployer address: ${deployerAddress}`);

  const proxyAddress = process.env.PROXY;
  if (!proxyAddress) {
    throw new Error('PROXY environment variable not set. Please provide the address of the proxy contract.');
  }
  if (!ethers.isAddress(proxyAddress)) {
    throw new Error(`Invalid address provided for PROXY: ${proxyAddress}`);
  }
  log(`Proxy address: ${proxyAddress}`);

  const isLocalNetwork = network.name === 'hardhat' || network.name === 'localhost';

  const confirmations = isLocalNetwork ? 1 : 5;
  log(`Deployment confirmations: ${confirmations}`);

  const constructorArgs = [proxyAddress];
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
