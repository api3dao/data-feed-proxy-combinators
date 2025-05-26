import type { HardhatRuntimeEnvironment } from 'hardhat/types';

module.exports = async ({ getUnnamedAccounts, deployments, ethers }: HardhatRuntimeEnvironment) => {
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

  await deployments.get('InverseApi3ReaderProxyV1').catch(async () => {
    return deploy('InverseApi3ReaderProxyV1', {
      from: deployerAddress,
      args: [proxyAddress],
      log: true,
    });
  });
};
module.exports.tags = ['InverseApi3ReaderProxyV1'];
