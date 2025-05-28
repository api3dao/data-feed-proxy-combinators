import { ethers } from 'ethers';

/**
 * Creates a deterministic deployment name based on a base name and constructor arguments.
 * @param baseName The base name for the contract (e.g., 'ProductApi3ReaderProxyV1').
 * @param constructorArgTypes Array of Solidity types for the constructor arguments.
 * @param constructorArgs Array of actual constructor argument values.
 * @returns A deterministic deployment name string.
 */
export const getDeploymentName = (baseName: string, constructorArgTypes: string[], constructorArgs: any[]): string => {
  // Ensure addresses are checksummed for consistent ABI encoding
  const processedArgs = constructorArgs.map((arg, index) => {
    if (constructorArgTypes[index] === 'address' && typeof arg === 'string' && ethers.isAddress(arg)) {
      return ethers.getAddress(arg); // Ensures checksum
    }
    return arg;
  });
  const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(constructorArgTypes, processedArgs);
  const argsHash = ethers.keccak256(encodedArgs).slice(2, 10); // Use a short 8-char hex hash (e.g., 'a1b2c3d4')
  return `${baseName}_${argsHash}`;
};
