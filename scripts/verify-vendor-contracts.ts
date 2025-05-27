import { execSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

import { glob } from 'glob';

async function main() {
  const vendors = [
    {
      path: join('@chainlink', 'contracts@1.2.0'),
      tarballUrl: 'https://registry.npmjs.org/@chainlink/contracts/-/contracts-1.2.0.tgz',
      packageContractsPath: '',
    },
  ];
  for (const vendor of vendors) {
    // eslint-disable-next-line no-console
    console.log(
      `Checking if contracts in ${vendor.path} are identical to the ones in the package at ${vendor.tarballUrl}`
    );
    // First creates the directory untarred-package, then downloads and untars
    // the package in untarred-package, stripping one layer to ignore the tar name
    execSync(
      `mkdir -p untarred-package | wget -qO- ${vendor.tarballUrl} | tar xvz -C untarred-package --strip-components=1`
    );
    const filePaths = await glob(`./contracts/vendor/${vendor.path}/**/*.sol`);
    for (const filePath of filePaths) {
      const vendorContract = readFileSync(filePath).toString();
      const packageContract = readFileSync(
        join(
          'untarred-package',
          vendor.packageContractsPath,
          relative(join('contracts', 'vendor', vendor.path), join(filePath))
        )
      ).toString();
      if (vendorContract === packageContract) {
        // eslint-disable-next-line no-console
        console.log(`${basename(filePath)} is identical!`);
      } else {
        throw new Error(`${basename(filePath)} is NOT identical!`);
      }
    }
    rmSync('untarred-package', { recursive: true, force: true });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.log(error);
    process.exit(1);
  });
