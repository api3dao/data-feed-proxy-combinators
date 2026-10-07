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
    // Hardhat-deploy scripts are named after the deployed contract and export an anonymous deploy function.
    files: ['deploy/**'],
    rules: {
      'unicorn/filename-case': 'off',
      'unicorn/no-anonymous-default-export': 'off',
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
