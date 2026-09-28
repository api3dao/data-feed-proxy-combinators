import { CHAINS } from '@api3/contracts';
import { verifyContract } from '@nomicfoundation/hardhat-verify/verify';
import type { Abi, DeployResult } from '@rocketh/deploy';
import { BrowserProvider } from 'ethers';
import hre from 'hardhat';

import type { Environment } from './config.js';

const CONFIRMATIONS = 5;

// Hardhat 3 calls its built-in in-memory network `default` where Hardhat 2 called it `hardhat`.
export const isLocalNetwork = (env: Environment) => env.name === 'default' || env.name === 'localhost';

export const verifyDeployment = async <TAbi extends Abi>(
  env: Environment,
  contractName: string,
  deployment: DeployResult<TAbi>,
  constructorArgs: unknown[]
) => {
  if (isLocalNetwork(env)) {
    env.showMessage('Skipping verification on local network.');
    return;
  }

  // hardhat-deploy v1 waited for the confirmations as part of the deployment, so that the block
  // explorer knows the contract by the time it is verified. rocketh reads the count only from a
  // per-chain config, so the wait is done here.
  if (deployment.newlyDeployed && deployment.transaction) {
    env.showMessage(`Waiting for ${CONFIRMATIONS} confirmations...`);
    await new BrowserProvider(env.network.provider).waitForTransaction(deployment.transaction.hash, CONFIRMATIONS);
  }

  const verificationApiType = CHAINS.find((chain) => chain.alias === env.name)?.verificationApi?.type;
  if (verificationApiType === undefined) {
    env.showMessage(`Verification API type is not defined for ${env.name}, skipping verification.`);
    return;
  }

  env.showMessage(`Attempting verification of ${contractName} at ${deployment.address}...`);
  await verifyContract(
    {
      address: deployment.address,
      constructorArgs,
      provider: verificationApiType === 'other' ? 'blockscout' : verificationApiType,
    },
    hre
  );
};
