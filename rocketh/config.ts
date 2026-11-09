import * as deployExtension from '@rocketh/deploy';
import type { EnhancedEnvironment, UnknownDeployments, UserConfig } from 'rocketh/types';

// Index 0 resolves against eth_accounts of the network provider, which derives its accounts from
// MNEMONIC. This replaces v1's getUnnamedAccounts()[0].
export const config = {
  accounts: {
    deployer: { default: 0 },
  },
  data: {},
} as const satisfies UserConfig;

// Only the deploy extension: the deploy scripts do not call read or execute, and deploy no proxies.
const extensions = { ...deployExtension };
export { extensions };

type Extensions = typeof extensions;
type Accounts = typeof config.accounts;
type Data = typeof config.data;
type Environment = EnhancedEnvironment<Accounts, Data, UnknownDeployments, Extensions>;

export type { Accounts, Data, Environment, Extensions };
