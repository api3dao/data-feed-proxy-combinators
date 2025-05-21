import { DeployFunction, DeploymentsExtension } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployTestFeed = async (deployments: DeploymentsExtension, deployerAddress: string) => {
    const { address: scaledApi3FeedProxyV1Address } = await deployments
        .get("ScaledApi3FeedProxyV1")
        .catch(async () => {
            return deployments.deploy("ScaledApi3FeedProxyV1", {
                from: deployerAddress,
                args: ["0x5b0cf2b36a65a6BB085D501B971e4c102B9Cd473", 8],
                log: true,
            });
        });
    return scaledApi3FeedProxyV1Address;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getUnnamedAccounts, network } = hre;
    const { deploy, log } = deployments;

    const [deployerAddress] = await getUnnamedAccounts();
    if (!deployerAddress) {
        throw new Error("No deployer address found.");
    }
    log(`Deployer address: ${deployerAddress}`);

    const feedAddress = network.name !== "hardhat" ? process.env.FEED : await deployTestFeed(deployments, deployerAddress);
    if (!feedAddress) {
        throw new Error("FEED environment variable not set. Please provide the address of the AggregatorV2V3Interface contract.");
    }
    if (!hre.ethers.isAddress(feedAddress)) {
        throw new Error(`Invalid address provided for FEED: ${feedAddress}`);
    }
    log(`Feed address: ${feedAddress}`);

    await deployments
        .get("NormalizedApi3ReaderProxyV1")
        .catch(async () => {
            return deploy("NormalizedApi3ReaderProxyV1", {
                from: deployerAddress,
                args: [feedAddress],
                log: true,
            });
        });
};

export default func;
func.tags = ['NormalizedApi3ReaderProxyV1'];