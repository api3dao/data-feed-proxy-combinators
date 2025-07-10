import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import * as helpers from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import * as testUtils from './test-utils';

describe('NormalizedApi3ReaderProxyV1', function () {
  async function deploy() {
    const roleNames = ['deployer'];
    const accounts = await ethers.getSigners();
    const roles: Record<string, HardhatEthersSigner> = roleNames.reduce((acc, roleName, index) => {
      return { ...acc, [roleName]: accounts[index] };
    }, {});

    const dappId = testUtils.generateRandomBytes32();
    const decimals = 8;
    const answer = ethers.parseUnits('0.25', decimals);
    const timestamp = await helpers.time.latest();

    const mockAggregatorV2V3Factory = await ethers.getContractFactory('MockAggregatorV2V3', roles.deployer);
    const feed = await mockAggregatorV2V3Factory.deploy(decimals, answer, timestamp);

    const normalizedApi3ReaderProxyV1Factory = await ethers.getContractFactory(
      'NormalizedApi3ReaderProxyV1',
      roles.deployer
    );
    const normalizedApi3ReaderProxyV1 = await normalizedApi3ReaderProxyV1Factory.deploy(
      await feed.getAddress(),
      dappId
    );

    return {
      feed,
      dappId,
      mockAggregatorV2V3Factory,
      normalizedApi3ReaderProxyV1,
      roles,
    };
  }

  function normalize(value: bigint, fromDecimals: number, toDecimals = 18): bigint {
    return fromDecimals === toDecimals
      ? value
      : fromDecimals > toDecimals
        ? value / BigInt(10 ** (fromDecimals - toDecimals))
        : value * BigInt(10 ** (toDecimals - fromDecimals));
  }

  describe('constructor', function () {
    context('feed is not zero address', function () {
      context('feed does not have 18 decimals', function () {
        it('constructs', async function () {
          const { feed, dappId, normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
          expect(await normalizedApi3ReaderProxyV1.feed()).to.equal(await feed.getAddress());
          expect(await normalizedApi3ReaderProxyV1.dappId()).to.equal(dappId);
          expect(await normalizedApi3ReaderProxyV1.isUpscaling()).to.equal(true); // 8 < 18 is true
          expect(await normalizedApi3ReaderProxyV1.scalingFactor()).to.equal(10_000_000_000n); // 10**(18-8)
        });
      });
      context('feed has 18 decimals', function () {
        it('reverts', async function () {
          const { dappId, roles, mockAggregatorV2V3Factory } = await helpers.loadFixture(deploy);
          const feed = await mockAggregatorV2V3Factory.deploy(18, ethers.parseEther('1'), await helpers.time.latest());
          const normalizedApi3ReaderProxyV1Factory = await ethers.getContractFactory(
            'NormalizedApi3ReaderProxyV1',
            roles.deployer
          );
          await expect(normalizedApi3ReaderProxyV1Factory.deploy(feed, dappId))
            .to.be.revertedWithCustomError(normalizedApi3ReaderProxyV1Factory, 'NoNormalizationNeeded')
            .withArgs();
        });
      });
    });
    context('feed is zero address', function () {
      it('reverts', async function () {
        const { dappId, roles } = await helpers.loadFixture(deploy);
        const normalizedApi3ReaderProxyV1Factory = await ethers.getContractFactory(
          'NormalizedApi3ReaderProxyV1',
          roles.deployer
        );
        await expect(normalizedApi3ReaderProxyV1Factory.deploy(ethers.ZeroAddress, dappId))
          .to.be.revertedWithCustomError(normalizedApi3ReaderProxyV1Factory, 'ZeroProxyAddress')
          .withArgs();
      });
    });
  });

  describe('read', function () {
    it('reads the normalized to 18 decimals rate', async function () {
      const { feed, dappId, mockAggregatorV2V3Factory, normalizedApi3ReaderProxyV1, roles } =
        await helpers.loadFixture(deploy);

      const decimals = await feed.decimals();
      const [, answer, , updatedAt] = await feed.latestRoundData();

      // Normalizes up
      const dataFeed = await normalizedApi3ReaderProxyV1.read();
      expect(dataFeed.value).to.equal(normalize(answer, Number(decimals)));
      expect(dataFeed.timestamp).to.equal(updatedAt);

      // Normalizes down
      const newFeed = await mockAggregatorV2V3Factory.deploy(8, answer, updatedAt);
      const normalizedApi3ReaderProxyV1Factory = await ethers.getContractFactory(
        'NormalizedApi3ReaderProxyV1',
        roles.deployer
      );
      const newNormalizedApi3ReaderProxyV1 = await normalizedApi3ReaderProxyV1Factory.deploy(
        await newFeed.getAddress(),
        dappId
      );
      const newDataFeed = await newNormalizedApi3ReaderProxyV1.read();
      expect(newDataFeed.value).to.equal(normalize(answer, 8));
      expect(newDataFeed.timestamp).to.equal(updatedAt);
    });
  });

  describe('latestAnswer', function () {
    it('returns proxy value', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [value] = await normalizedApi3ReaderProxyV1.read();
      expect(await normalizedApi3ReaderProxyV1.latestAnswer()).to.be.equal(value);
    });
  });

  describe('latestTimestamp', function () {
    it('returns proxy value', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [, timestamp] = await normalizedApi3ReaderProxyV1.read();
      expect(await normalizedApi3ReaderProxyV1.latestTimestamp()).to.be.equal(timestamp);
    });
  });

  describe('latestRound', function () {
    it('reverts', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      await expect(normalizedApi3ReaderProxyV1.latestRound())
        .to.be.revertedWithCustomError(normalizedApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('getAnswer', function () {
    it('reverts', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(normalizedApi3ReaderProxyV1.getAnswer(blockNumber))
        .to.be.revertedWithCustomError(normalizedApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('getTimestamp', function () {
    it('reverts', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(normalizedApi3ReaderProxyV1.getTimestamp(blockNumber))
        .to.be.revertedWithCustomError(normalizedApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('decimals', function () {
    it('returns 18', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      expect(await normalizedApi3ReaderProxyV1.decimals()).to.equal(18);
    });
  });

  describe('description', function () {
    it('returns empty string', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      expect(await normalizedApi3ReaderProxyV1.description()).to.equal('');
    });
  });

  describe('version', function () {
    it('returns 4916', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      expect(await normalizedApi3ReaderProxyV1.version()).to.equal(4916);
    });
  });

  describe('getRoundData', function () {
    it('reverts', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(normalizedApi3ReaderProxyV1.getRoundData(blockNumber))
        .to.be.revertedWithCustomError(normalizedApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('latestRoundData', function () {
    it('returns approximated round data', async function () {
      const { normalizedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [value, timestamp] = await normalizedApi3ReaderProxyV1.read();
      const [roundId, answer, startedAt, updatedAt, answeredInRound] =
        await normalizedApi3ReaderProxyV1.latestRoundData();
      expect(roundId).to.equal(0);
      expect(answer).to.equal(value);
      expect(startedAt).to.equal(timestamp);
      expect(updatedAt).to.equal(timestamp);
      expect(answeredInRound).to.equal(0);
    });
  });
});
