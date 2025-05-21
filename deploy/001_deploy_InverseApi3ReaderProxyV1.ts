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

    const proxyAddress = process.env.PROXY;
    if (!proxyAddress) {
        throw new Error("PROXY environment variable not set. Please provide the address of the proxy contract.");
    }
    if (!hre.ethers.isAddress(proxyAddress)) {
        throw new Error(`Invalid address provided for PROXY: ${proxyAddress}`);
    }
    log(`Proxy address: ${proxyAddress}`);

    await deployments
        .get("InverseApi3ReaderProxyV1")
        .catch(async () => {
            return deploy("InverseApi3ReaderProxyV1", {
                from: deployerAddress,
                args: [proxyAddress],
                log: true,
            });
        });
};

export default func;
func.tags = ['InverseApi3ReaderProxyV1'];