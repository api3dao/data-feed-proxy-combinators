import { ethers } from 'ethers';

import { ProductApi3ReaderProxyV1__factory } from '../typechain-types';

const deployPriceFeedProxy = async () => {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER);
  const signer = new ethers.Wallet(process.env.PK!, provider);
  const productApi3ReaderProxyV1Factory = new ProductApi3ReaderProxyV1__factory(signer);
  console.info('Deploying product proxy...');
  const tx = await productApi3ReaderProxyV1Factory.deploy(
    '', // TODO: Deploy WstETHApi3ReaderProxyV1.sol
    '0x37422cC8e1487a0452cc0D0BF75877d86c63c88A' // https://market.api3.org/ethereum/eth-usd/integrate?dappAlias=morpho-wsteth-usdc-860-lltv
  );
  const productApi3ReaderProxyV1 = await tx.waitForDeployment();
  console.info('Deployed ProductApi3ReaderProxyV1:', await productApi3ReaderProxyV1.getAddress());
  console.info('ProductApi3ReaderProxyV1.read():', await productApi3ReaderProxyV1.read());
  // Deployed on Base: 0x707991d5533021021cC360dF093f1B396340Ef3E
};

deployPriceFeedProxy();

// NOTE: https://market.api3.org/ethereum/usdc-usd/integrate?dappAlias=morpho-wsteth-usdc-860-lltv
