const { join } = require('node:path');

const commons = require('@api3/eslint-plugin-commons');
const { includeIgnoreFile } = require('eslint/config');

module.exports = [
  includeIgnoreFile(join(__dirname, '.gitignore')),
  ...commons.configs.universal,
  {
    files: ['**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    // Each deploy script takes the name of the contract it deploys, and hardhat-deploy loads it through its default export.
    files: ['deploy/**'],
    rules: {
      'import-x/no-default-export': 'off',
      'unicorn/filename-case': 'off',
    },
  },
  {
    files: ['package.json'],
    rules: {
      'package-json/no-orphan-types': ['error', { ignore: ['@types/mocha'] }], // Hardhat bundles Mocha, which runs the tests.
      'package-json/prefer-exports': 'off', // No "exports" map on purpose, it hides unlisted subpaths like the Solidity contracts. See #107.
    },
  },
];
