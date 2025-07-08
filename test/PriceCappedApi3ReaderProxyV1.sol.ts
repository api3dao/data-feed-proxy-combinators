import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import * as helpers from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import * as testUtils from './test-utils';

describe('PriceCappedApi3ReaderProxyV1', function () {
  async function deploy() {
    const roleNames = ['deployer'];
    const accounts = await ethers.getSigners();
    const roles: Record<string, HardhatEthersSigner> = roleNames.reduce((acc, roleName, index) => {
      return { ...acc, [roleName]: accounts[index] };
    }, {});

    const dappId = testUtils.generateRandomBytes32();
    const beaconValue = ethers.parseEther('1.0001');
    const beaconTimestamp = await helpers.time.latest();
    const mockApi3ReaderProxyV1Factory = await ethers.getContractFactory('MockApi3ReaderProxyV1', roles.deployer);
    const proxy = await mockApi3ReaderProxyV1Factory.deploy(dappId, beaconValue, beaconTimestamp);

    const lowerBound = ethers.parseEther('0.9995');
    const upperBound = ethers.parseEther('1.0005');

    const priceCappedApi3ReaderProxyV1Factory = await ethers.getContractFactory(
      'PriceCappedApi3ReaderProxyV1',
      roles.deployer
    );
    const priceCappedApi3ReaderProxyV1 = await priceCappedApi3ReaderProxyV1Factory.deploy(
      await proxy.getAddress(),
      lowerBound,
      upperBound
    );

    return {
      proxy,
      priceCappedApi3ReaderProxyV1,
      lowerBound,
      upperBound,
      roles,
    };
  }

  describe('constructor', function () {
    context('proxy is not zero address', function () {
      context('lowerBound is not negative', function () {
        context('upperBound is greater or  equal to lowerBound', function () {
          it('constructs', async function () {
            const { proxy, priceCappedApi3ReaderProxyV1, lowerBound, upperBound } = await helpers.loadFixture(deploy);
            expect(await priceCappedApi3ReaderProxyV1.proxy()).to.equal(await proxy.getAddress());
            expect(await priceCappedApi3ReaderProxyV1.dappId()).to.equal(await proxy.dappId());
            expect(await priceCappedApi3ReaderProxyV1.lowerBound()).to.equal(lowerBound);
            expect(await priceCappedApi3ReaderProxyV1.upperBound()).to.equal(upperBound);
          });
        });
        context('upperBound is less than lowerBound', function () {
          it('reverts', async function () {
            const { proxy, lowerBound, upperBound, roles } = await helpers.loadFixture(deploy);
            const priceCappedApi3ReaderProxyV1 = await ethers.getContractFactory(
              'PriceCappedApi3ReaderProxyV1',
              roles.deployer
            );
            await expect(priceCappedApi3ReaderProxyV1.deploy(proxy, upperBound, lowerBound))
              .to.be.revertedWithCustomError(priceCappedApi3ReaderProxyV1, 'UpperBoundMustBeGreaterOrEqualToLowerBound')
              .withArgs();
          });
        });
      });
      context('lowerBound is negative', function () {
        it('reverts', async function () {
          const { proxy, upperBound, roles } = await helpers.loadFixture(deploy);
          const priceCappedApi3ReaderProxyV1 = await ethers.getContractFactory(
            'PriceCappedApi3ReaderProxyV1',
            roles.deployer
          );
          await expect(priceCappedApi3ReaderProxyV1.deploy(proxy, ethers.parseEther('-0.9995'), upperBound))
            .to.be.revertedWithCustomError(priceCappedApi3ReaderProxyV1, 'LowerBoundMustBeNonNegative')
            .withArgs();
        });
      });
    });
    context('proxy is zero address', function () {
      it('reverts', async function () {
        const { roles, lowerBound, upperBound } = await helpers.loadFixture(deploy);
        const priceCappedApi3ReaderProxyV1 = await ethers.getContractFactory(
          'PriceCappedApi3ReaderProxyV1',
          roles.deployer
        );
        await expect(priceCappedApi3ReaderProxyV1.deploy(ethers.ZeroAddress, lowerBound, upperBound))
          .to.be.revertedWithCustomError(priceCappedApi3ReaderProxyV1, 'ZeroProxyAddress')
          .withArgs();
      });
    });
  });

  describe('read', function () {
    it('reads the capped rate', async function () {
      const { proxy, priceCappedApi3ReaderProxyV1, lowerBound, upperBound } = await helpers.loadFixture(deploy);
      const dataFeed = await priceCappedApi3ReaderProxyV1.read();

      const [value, timestamp] = await proxy.read();
      expect(dataFeed.value).to.equal(value);
      expect(dataFeed.timestamp).to.equal(timestamp);

      let newTimestamp = await helpers.time.latest();
      await proxy.update(ethers.parseEther('0.9991'), newTimestamp);

      const cappedToLowerBoundDataFeed = await priceCappedApi3ReaderProxyV1.read();
      expect(cappedToLowerBoundDataFeed.value).to.equal(lowerBound);
      expect(cappedToLowerBoundDataFeed.timestamp).to.equal(newTimestamp);

      newTimestamp = await helpers.time.latest();
      await proxy.update(ethers.parseEther('1.0006'), newTimestamp);

      const cappedToUpperBoundDataFeed = await priceCappedApi3ReaderProxyV1.read();
      expect(cappedToUpperBoundDataFeed.value).to.equal(upperBound);
      expect(cappedToUpperBoundDataFeed.timestamp).to.equal(newTimestamp);
    });
  });

  describe('latestAnswer', function () {
    it('returns proxy value', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [value] = await priceCappedApi3ReaderProxyV1.read();
      expect(await priceCappedApi3ReaderProxyV1.latestAnswer()).to.be.equal(value);
    });
  });

  describe('latestTimestamp', function () {
    it('returns proxy value', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [, timestamp] = await priceCappedApi3ReaderProxyV1.read();
      expect(await priceCappedApi3ReaderProxyV1.latestTimestamp()).to.be.equal(timestamp);
    });
  });

  describe('latestRound', function () {
    it('reverts', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      await expect(priceCappedApi3ReaderProxyV1.latestRound())
        .to.be.revertedWithCustomError(priceCappedApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('getAnswer', function () {
    it('reverts', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(priceCappedApi3ReaderProxyV1.getAnswer(blockNumber))
        .to.be.revertedWithCustomError(priceCappedApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('getTimestamp', function () {
    it('reverts', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(priceCappedApi3ReaderProxyV1.getTimestamp(blockNumber))
        .to.be.revertedWithCustomError(priceCappedApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('decimals', function () {
    it('returns 18', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      expect(await priceCappedApi3ReaderProxyV1.decimals()).to.equal(18);
    });
  });

  describe('description', function () {
    it('returns empty string', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      expect(await priceCappedApi3ReaderProxyV1.description()).to.equal('');
    });
  });

  describe('version', function () {
    it('returns 4915', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      expect(await priceCappedApi3ReaderProxyV1.version()).to.equal(4918);
    });
  });

  describe('getRoundData', function () {
    it('reverts', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(priceCappedApi3ReaderProxyV1.getRoundData(blockNumber))
        .to.be.revertedWithCustomError(priceCappedApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('latestRoundData', function () {
    it('returns approximated round data', async function () {
      const { priceCappedApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [value, timestamp] = await priceCappedApi3ReaderProxyV1.read();
      const [roundId, answer, startedAt, updatedAt, answeredInRound] =
        await priceCappedApi3ReaderProxyV1.latestRoundData();
      expect(roundId).to.equal(0);
      expect(answer).to.equal(value);
      expect(startedAt).to.equal(timestamp);
      expect(updatedAt).to.equal(timestamp);
      expect(answeredInRound).to.equal(0);
    });
  });
});
