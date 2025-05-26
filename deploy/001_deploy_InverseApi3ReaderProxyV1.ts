import type { HardhatRuntimeEnvironment } from 'hardhat/types';

const VERIFICATION_BLOCK_CONFIRMATIONS = 5;

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

  const confirmations = isLocalNetwork ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;
  log(`Deployment confirmations: ${confirmations}`);

  const contractName = 'InverseApi3ReaderProxyV1';

  const deployment = await deploy(contractName, {
    from: deployerAddress,
    args: [proxyAddress],
    log: true,
    waitConfirmations: confirmations,
  });

  if (isLocalNetwork) {
    log('Skipping verification on local network.');
    return;
  }

  log(`Attempting verification of ${contractName} (already waited for confirmations)...`);
  await run('verify:verify', {
    address: deployment.address,
    constructorArguments: deployment.args,
  });
};
module.exports.tags = ['InverseApi3ReaderProxyV1'];
