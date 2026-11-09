import { setupDeployScripts } from 'rocketh';

import { extensions, type Accounts, type Data, type Extensions } from './config.js';

const { deployScript } = setupDeployScripts<Extensions, Accounts, Data>(extensions);

export * as artifacts from '../generated/artifacts/index.js';
export { deployScript };
