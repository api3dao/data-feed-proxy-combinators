import * as fs from 'node:fs';
import { join, parse as parsePath } from 'node:path';

import type { AddressLike } from 'ethers';

export interface DeploymentAddressEntry {
  address: AddressLike;
  constructorArgs?: any[];
  constructorArgTypes?: string[];
}

export interface ChainDeploymentAddresses {
  [chainId: string]: DeploymentAddressEntry;
}

export interface AllDeploymentAddresses {
  [deploymentName: string]: ChainDeploymentAddresses;
}

/**
 * Reads deployment artifacts from the `deployments` directory (specific to data-feed-proxy-combinators)
 * and aggregates contract addresses, constructor arguments, and types by deployment name and chain ID.
 * @returns A stringified JSON object of deployment addresses.
 */
export function getDeploymentAddresses(): string {
  const allAddresses: AllDeploymentAddresses = {};
  const deploymentsRoot = join(__dirname, '..', '..', 'deployments');

  if (!fs.existsSync(deploymentsRoot)) {
    throw new Error(`Deployments directory not found at ${deploymentsRoot}.`);
  }

  const networkDirs = fs
    .readdirSync(deploymentsRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && dirent.name !== 'localhost' && dirent.name !== 'hardhat')
    .map((dirent) => dirent.name);

  for (const networkName of networkDirs) {
    const networkPath = join(deploymentsRoot, networkName);
    const chainIdFilePath = join(networkPath, '.chainId');
    if (!fs.existsSync(chainIdFilePath)) continue;
    const chainId = fs.readFileSync(chainIdFilePath, 'utf8').trim();

    const deploymentFiles = fs
      .readdirSync(networkPath, { withFileTypes: true })
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json'))
      .map((dirent) => dirent.name);

    for (const deploymentFile of deploymentFiles) {
      const deploymentName = parsePath(deploymentFile).name;
      const artifact = JSON.parse(fs.readFileSync(join(networkPath, deploymentFile), 'utf8'));
      const constructorEntry = artifact.abi.find((item: any) => item.type === 'constructor');
      const constructorArgTypes = constructorEntry?.inputs?.map((input: any) => input.type) || [];

      if (!allAddresses[deploymentName]) allAddresses[deploymentName] = {};
      allAddresses[deploymentName][chainId] = {
        address: artifact.address,
        constructorArgs: artifact.args || [],
        constructorArgTypes,
      };
    }
  }
  return `${JSON.stringify(allAddresses, null, 2)}\n`;
}
