import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { DeploymentsExtension } from 'hardhat-deploy/types';

import { getDeploymentName } from '../src';

export const CONTRACT_NAME = 'ScaledApi3FeedProxyV1';

const deployTestProxy = async (deployments: DeploymentsExtension, deployerAddress: string) => {
  const { address: inverseApi3ReaderProxyV1Address } = await deployments
    .get('InverseApi3ReaderProxyV1')
    .catch(async () => {
      return deployments.deploy('InverseApi3ReaderProxyV1', {
        from: deployerAddress,
        args: ['0x5b0cf2b36a65a6BB085D501B971e4c102B9Cd473'],
        log: true,
      });
    });
  return inverseApi3ReaderProxyV1Address;
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

  const proxyAddress =
    network.name === 'hardhat' ? await deployTestProxy(deployments, deployerAddress) : process.env.PROXY;
  if (!proxyAddress) {
    throw new Error('PROXY environment variable not set. Please provide the address of the Api3ReaderProxy contract.');
  }
  if (!ethers.isAddress(proxyAddress)) {
    throw new Error(`Invalid address provided for PROXY: ${proxyAddress}`);
  }
  log(`Proxy address: ${proxyAddress}`);

  const isLocalNetwork = network.name === 'hardhat' || network.name === 'localhost';

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
