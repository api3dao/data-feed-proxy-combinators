import { DeployFunction, DeploymentsExtension } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployTestProxy = async (deployments: DeploymentsExtension, deployerAddress: string) => {
    const { address: inverseApi3ReaderProxyV1Address } = await deployments
        .get("InverseApi3ReaderProxyV1")
        .catch(async () => {
            return deployments.deploy("InverseApi3ReaderProxyV1", {
                from: deployerAddress,
                args: ["0x5b0cf2b36a65a6BB085D501B971e4c102B9Cd473"],
                log: true,
            });
        });
    return inverseApi3ReaderProxyV1Address;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getUnnamedAccounts, network } = hre;
    const { deploy, log } = deployments;

    const [deployerAddress] = await getUnnamedAccounts();
    if (!deployerAddress) {
        throw new Error("No deployer address found.");
    }
    log(`Deployer address: ${deployerAddress}`);

    const proxyAddress = network.name !== "hardhat" ? process.env.PROXY : await deployTestProxy(deployments, deployerAddress);
    if (!proxyAddress) {
        throw new Error("PROXY environment variable not set. Please provide the address of the Api3ReaderProxy contract.");
    }
    if (!hre.ethers.isAddress(proxyAddress)) {
        throw new Error(`Invalid address provided for PROXY: ${proxyAddress}`);
    }
    log(`Proxy address: ${proxyAddress}`);

    const decimals = process.env.DECIMALS ? parseInt(process.env.DECIMALS) : 18;
    log(`Decimals: ${decimals}`);

    await deployments
        .get("ScaledApi3FeedProxyV1")
        .catch(async () => {
            return deploy("ScaledApi3FeedProxyV1", {
                from: deployerAddress,
                args: [proxyAddress, decimals],
                log: true,
            });
        });
};

export default func;
func.tags = ['ScaledApi3FeedProxyV1'];