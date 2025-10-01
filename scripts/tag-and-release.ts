import { join } from 'node:path';

import { tagAndRelease } from '@api3/commons';

const main = async () => {
  const packageJsonPath = join(__dirname, '../package.json'); // the script is one level deep in the repo
  await tagAndRelease('data-feed-proxy-combinators', packageJsonPath);
};

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.info(error);
    process.exitCode = 1;
  });
