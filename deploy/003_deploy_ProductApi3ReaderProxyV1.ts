import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getUnnamedAccounts } = hre;
    const { deploy, log } = deployments;

    const [deployerAddress] = await getUnnamedAccounts();
    if (!deployerAddress) {
        throw new Error("No deployer address found.");
    }
    log(`Deployer address: ${deployerAddress}`);

    const proxy1Address = process.env.PROXY1;
    if (!proxy1Address) {
        throw new Error("PROXY1 environment variable not set. Please provide the address of the first proxy contract.");
    }
    if (!hre.ethers.isAddress(proxy1Address)) {
        throw new Error(`Invalid address provided for PROXY1: ${proxy1Address}`);
    }
    log(`Proxy 1 address: ${proxy1Address}`);

    const proxy2Address = process.env.PROXY2;
    if (!proxy2Address) {
        throw new Error("PROXY2 environment variable not set. Please provide the address of the second proxy contract.");
    }
    if (!hre.ethers.isAddress(proxy2Address)) {
        throw new Error(`Invalid address provided for PROXY2: ${proxy2Address}`);
    }
    log(`Proxy 2 address: ${proxy2Address}`);

    await deployments
        .get("ProductApi3ReaderProxyV1")
        .catch(async () => {
            return deploy("ProductApi3ReaderProxyV1", {
                from: deployerAddress,
                args: [proxy1Address, proxy2Address],
                log: true,
            });
        });
};

export default func;
func.tags = ['ProductApi3ReaderProxyV1'];