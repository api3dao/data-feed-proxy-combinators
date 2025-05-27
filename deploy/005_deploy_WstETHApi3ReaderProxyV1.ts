import type { HardhatRuntimeEnvironment } from 'hardhat/types';

// Note: getDeploymentName is not strictly needed here as there are no constructor args,
// but kept for potential future consistency if desired. For no-arg singletons,
// using the contract name directly as the deployment name is often simplest.
// import { getDeploymentName } from '../src/deployment';

const CONTRACT_NAME = 'WstETHApi3ReaderProxyV1';

module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const { getUnnamedAccounts, deployments, network, run } = hre;
  const { deploy, log } = deployments;

  const [deployerAddress] = await getUnnamedAccounts();
  if (!deployerAddress) {
    throw new Error('No deployer address found.');
  }
  log(`Deployer address: ${deployerAddress}`);

  const isLocalNetwork = network.name === 'hardhat' || network.name === 'localhost';

  const confirmations = isLocalNetwork ? 1 : 5;
  log(`Deployment confirmations: ${confirmations}`);

  // For contracts with no constructor args, using the contract name directly is common.
  log(`Deployment name for this instance: ${CONTRACT_NAME}`);

  const deployment = await deploy(CONTRACT_NAME, {
    contract: CONTRACT_NAME,
    from: deployerAddress,
    log: true,
    waitConfirmations: confirmations,
  });

  if (isLocalNetwork) {
    log('Skipping verification on local network.');
    return;
  }

  log(`Attempting verification of ${CONTRACT_NAME} at ${deployment.address} (already waited for confirmations)...`);
  await run('verify:verify', {
    address: deployment.address,
  });
};
module.exports.tags = [CONTRACT_NAME];
