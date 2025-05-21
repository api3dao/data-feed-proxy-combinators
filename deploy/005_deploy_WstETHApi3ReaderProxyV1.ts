import { type HardhatRuntimeEnvironment } from 'hardhat/types';
import { type DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getUnnamedAccounts } = hre;
  const { deploy, log } = deployments;

  const [deployerAddress] = await getUnnamedAccounts();
  if (!deployerAddress) {
    throw new Error('No deployer address found.');
  }
  log(`Deployer address: ${deployerAddress}`);

  await deployments.get('WstETHApi3ReaderProxyV1').catch(async () => {
    return deploy('WstETHApi3ReaderProxyV1', {
      from: deployerAddress,
      args: [],
      log: true,
    });
  });
};

// eslint-disable-next-line import/no-default-export
export default func;
func.tags = ['WstETHApi3ReaderProxyV1'];
