import * as fs from 'node:fs';
import { join } from 'node:path';

import { getDeploymentAddresses } from './src/deployment-addresses';

async function main(): Promise<void> {
  const addressesJsonPath = join('deployments', 'addresses.json');
  const existingAddressesJsonString = fs.existsSync(addressesJsonPath)
    ? fs.readFileSync(addressesJsonPath, 'utf8')
    : '{}';

  const generatedAddressesJsonString = await getDeploymentAddresses();

  // Normalize by parsing and re-stringifying to ensure consistent formatting for comparison
  const normalizedExisting = `${JSON.stringify(JSON.parse(existingAddressesJsonString), null, 2)}\n`;
  const normalizedGenerated = `${JSON.stringify(JSON.parse(generatedAddressesJsonString), null, 2)}\n`;

  if (normalizedExisting !== normalizedGenerated) {
    throw new Error(`${addressesJsonPath} is outdated. Please run "pnpm generate:deployment-addresses".`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
