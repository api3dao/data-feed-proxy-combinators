import * as fs from 'node:fs';
import { join } from 'node:path';

import { getDeploymentAddresses } from './src/deployment-addresses';

async function main(): Promise<void> {
  fs.writeFileSync(join('deployments', 'addresses.json'), getDeploymentAddresses());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
