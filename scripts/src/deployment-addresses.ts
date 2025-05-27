import * as fs from 'node:fs';
import { join, parse as parsePath } from 'node:path';

import type { AddressLike } from 'ethers';
import { format } from 'prettier';

const PRETTIER_CONFIG = join(__dirname, '..', '..', '.prettierrc');

export interface Deployment {
  deploymentName: string; // The full deterministic name from the artifact file
  address: AddressLike;
  constructorArgs?: any[];
  constructorArgTypes?: string[];
}

export interface DeploymentsByChain {
  [chainId: string]: Deployment[];
}

export interface AllDeploymentsByContract {
  [contractName: string]: DeploymentsByChain;
}

// Helper to extract contract name from a deployment name
function extractContractName(deploymentName: string): string {
  if (!deploymentName) return '';

  const lastUnderscoreIndex = deploymentName.lastIndexOf('_');
  if (lastUnderscoreIndex < 0 || lastUnderscoreIndex === deploymentName.length - 1) {
    return deploymentName;
  }

  const potentialSuffix = deploymentName.slice(lastUnderscoreIndex + 1);
  if (potentialSuffix.length === 8 && /^[\dA-Fa-f]+$/.test(potentialSuffix)) {
    return deploymentName.slice(0, lastUnderscoreIndex);
  }

  return deploymentName;
}

/**
 * Reads deployment artifacts from the `deployments` directory (specific to data-feed-proxy-combinators)
 * and aggregates contract addresses, constructor arguments, and types by contract name, then by chain ID,
 * with an array of deployment instances.
 * @returns A stringified JSON object of deployment addresses.
 */
export async function getDeploymentAddresses(): Promise<string> {
  const allDeployments: AllDeploymentsByContract = {};
  // Assumes this script is in data-feed-proxy-combinators/scripts/src/
  // and the deployments directory is at data-feed-proxy-combinators/deployments/
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
      const contractName = extractContractName(deploymentName);

      const artifact = JSON.parse(fs.readFileSync(join(networkPath, deploymentFile), 'utf8'));
      const constructorEntry = artifact.abi?.find(
        (item: { type: string; inputs?: unknown[] }) => item.type === 'constructor'
      );
      const constructorArgTypes = constructorEntry?.inputs?.map((input: { type: string }) => input.type) ?? [];

      const instanceDetail: Deployment = {
        deploymentName,
        address: artifact.address,
        constructorArgs: artifact.args || [],
        constructorArgTypes,
      };

      allDeployments[contractName] = {
        ...allDeployments[contractName],
        [chainId]: [...(allDeployments[contractName]?.[chainId] ?? []), instanceDetail],
      };
    }
  }

  const rawContent = JSON.stringify(allDeployments);
  const prettierConfig = JSON.parse(fs.readFileSync(PRETTIER_CONFIG, 'utf8'));
  return format(rawContent, { ...prettierConfig, parser: 'json' });
}
