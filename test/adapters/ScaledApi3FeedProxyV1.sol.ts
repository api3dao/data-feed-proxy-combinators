import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import * as helpers from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import * as testUtils from '../test-utils';

describe('ScaledApi3FeedProxyV1', function () {
  async function deploy() {
    const roleNames = ['deployer'];
    const accounts = await ethers.getSigners();
    const roles: Record<string, HardhatEthersSigner> = roleNames.reduce((acc, roleName, index) => {
      return { ...acc, [roleName]: accounts[index] };
    }, {});

    const dappId = testUtils.generateRandomBytes32();
    const beaconValue = ethers.parseEther('1.0001');
    const beaconTimestamp = await helpers.time.latest();
    const mockproxyFactory = await ethers.getContractFactory('MockApi3ReaderProxyV1', roles.deployer);
    const proxy = await mockproxyFactory.deploy(dappId, beaconValue, beaconTimestamp);

    const decimals = 8;

    const scaledApi3FeedProxyV1Factory = await ethers.getContractFactory('ScaledApi3FeedProxyV1', roles.deployer);
    const scaledApi3FeedProxyV1 = await scaledApi3FeedProxyV1Factory.deploy(await proxy.getAddress(), decimals);

    return {
      proxy,
      decimals,
      scaledApi3FeedProxyV1,
      roles,
    };
  }

  function scale(value: bigint, decimals: number) {
    return decimals === 18
      ? value
      : decimals > 18
        ? value * BigInt(10 ** (decimals - 18))
        : value / BigInt(10 ** (18 - decimals));
  }

  describe('constructor', function () {
    context('proxy is not zero address', function () {
      context('targetDecimals is not invalid', function () {
        context('targetDecimals is not 18', function () {
          it('constructs', async function () {
            const { proxy, scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
            expect(await scaledApi3FeedProxyV1.proxy()).to.equal(await proxy.getAddress());
            expect(await scaledApi3FeedProxyV1.dappId()).to.equal(await proxy.dappId());
            expect(await scaledApi3FeedProxyV1.isUpscaling()).to.equal(false); // targetDecimals (8) > 18 is false
            expect(await scaledApi3FeedProxyV1.scalingFactor()).to.equal(10_000_000_000n); // 10**(18-8)
          });
        });
        context('targetDecimals is 18', function () {
          it('reverts', async function () {
            const { proxy, roles } = await helpers.loadFixture(deploy);
            const scaledApi3FeedProxyV1 = await ethers.getContractFactory('ScaledApi3FeedProxyV1', roles.deployer);
            await expect(scaledApi3FeedProxyV1.deploy(await proxy.getAddress(), 18))
              .to.be.revertedWithCustomError(scaledApi3FeedProxyV1, 'NoScalingNeeded')
              .withArgs();
          });
        });
      });
      context('targetDecimals is invalid', function () {
        it('reverts', async function () {
          const { proxy, roles } = await helpers.loadFixture(deploy);
          const scaledApi3FeedProxyV1 = await ethers.getContractFactory('ScaledApi3FeedProxyV1', roles.deployer);
          await expect(scaledApi3FeedProxyV1.deploy(await proxy.getAddress(), 0))
            .to.be.revertedWithCustomError(scaledApi3FeedProxyV1, 'InvalidDecimals')
            .withArgs();
          await expect(scaledApi3FeedProxyV1.deploy(await proxy.getAddress(), 37))
            .to.be.revertedWithCustomError(scaledApi3FeedProxyV1, 'InvalidDecimals')
            .withArgs();
        });
      });
    });
    context('proxy is zero address', function () {
      it('reverts', async function () {
        const { decimals, roles } = await helpers.loadFixture(deploy);
        const scaledApi3FeedProxyV1 = await ethers.getContractFactory('ScaledApi3FeedProxyV1', roles.deployer);
        await expect(scaledApi3FeedProxyV1.deploy(ethers.ZeroAddress, decimals))
          .to.be.revertedWithCustomError(scaledApi3FeedProxyV1, 'ZeroProxyAddress')
          .withArgs();
      });
    });
  });

  describe('latestAnswer', function () {
    it('returns proxy value', async function () {
      const { decimals, proxy, scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      const [value] = await proxy.read();
      expect(await scaledApi3FeedProxyV1.latestAnswer()).to.be.equal(scale(value, decimals));
    });
  });

  describe('latestTimestamp', function () {
    it('returns proxy value', async function () {
      const { proxy, scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      const [, timestamp] = await proxy.read();
      expect(await scaledApi3FeedProxyV1.latestTimestamp()).to.be.equal(timestamp);
    });
  });

  describe('latestRound', function () {
    it('reverts', async function () {
      const { scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      await expect(scaledApi3FeedProxyV1.latestRound())
        .to.be.revertedWithCustomError(scaledApi3FeedProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('getAnswer', function () {
    it('reverts', async function () {
      const { scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(scaledApi3FeedProxyV1.getAnswer(blockNumber))
        .to.be.revertedWithCustomError(scaledApi3FeedProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('getTimestamp', function () {
    it('reverts', async function () {
      const { scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(scaledApi3FeedProxyV1.getTimestamp(blockNumber))
        .to.be.revertedWithCustomError(scaledApi3FeedProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('decimals', function () {
    it('returns 18', async function () {
      const { decimals, scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      expect(await scaledApi3FeedProxyV1.decimals()).to.equal(decimals);
    });
  });

  describe('description', function () {
    it('returns empty string', async function () {
      const { scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      expect(await scaledApi3FeedProxyV1.description()).to.equal('');
    });
  });

  describe('version', function () {
    it('returns 4917', async function () {
      const { scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      expect(await scaledApi3FeedProxyV1.version()).to.equal(4917);
    });
  });

  describe('getRoundData', function () {
    it('reverts', async function () {
      const { scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(scaledApi3FeedProxyV1.getRoundData(blockNumber))
        .to.be.revertedWithCustomError(scaledApi3FeedProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('latestRoundData', function () {
    it('returns approximated round data', async function () {
      const { decimals, proxy, scaledApi3FeedProxyV1 } = await helpers.loadFixture(deploy);
      const [value, timestamp] = await proxy.read();
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = await scaledApi3FeedProxyV1.latestRoundData();
      expect(roundId).to.equal(0);
      expect(answer).to.equal(scale(value, decimals));
      expect(startedAt).to.equal(timestamp);
      expect(updatedAt).to.equal(timestamp);
      expect(answeredInRound).to.equal(0);
    });
  });
});
