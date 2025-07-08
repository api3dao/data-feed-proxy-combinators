import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import * as helpers from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import * as testUtils from './test-utils';

describe('ProductApi3ReaderProxyV1', function () {
  async function deploy() {
    const roleNames = ['deployer'];
    const accounts = await ethers.getSigners();
    const roles: Record<string, HardhatEthersSigner> = roleNames.reduce((acc, roleName, index) => {
      return { ...acc, [roleName]: accounts[index] };
    }, {});

    const dappId = testUtils.generateRandomBytes32();
    const mockApi3ReaderProxyV1Factory = await ethers.getContractFactory('MockApi3ReaderProxyV1', roles.deployer);
    const beaconValue1 = ethers.parseEther('1824.97');
    const beaconTimestamp1 = await helpers.time.latest();
    const proxy1 = await mockApi3ReaderProxyV1Factory.deploy(dappId, beaconValue1, beaconTimestamp1);
    const beaconValue2 = ethers.parseEther('0.08202');
    const beaconTimestamp2 = await helpers.time.latest();
    const proxy2 = await mockApi3ReaderProxyV1Factory.deploy(dappId, beaconValue2, beaconTimestamp2);

    const productApi3ReaderProxyV1Factory = await ethers.getContractFactory('ProductApi3ReaderProxyV1', roles.deployer);

    const productApi3ReaderProxyV1 = await productApi3ReaderProxyV1Factory.deploy(
      proxy1.getAddress(),
      proxy2.getAddress()
    );

    const productApi3ReaderProxyV1Compound = await productApi3ReaderProxyV1Factory.deploy(
      proxy1.getAddress(),
      productApi3ReaderProxyV1.getAddress()
    );

    return {
      proxy1,
      proxy2,
      productApi3ReaderProxyV1,
      productApi3ReaderProxyV1Compound,
      roles,
    };
  }

  describe('constructor', function () {
    context('proxy1 is not zero address', function () {
      context('proxy2 is not zero address', function () {
        context('proxy1 is not the same as proxy2', function () {
          it('constructs', async function () {
            const { proxy1, proxy2, productApi3ReaderProxyV1, productApi3ReaderProxyV1Compound } =
              await helpers.loadFixture(deploy);
            expect(await productApi3ReaderProxyV1.proxy1()).to.equal(await proxy1.getAddress());
            expect(await productApi3ReaderProxyV1.proxy2()).to.equal(await proxy2.getAddress());
            expect(await productApi3ReaderProxyV1.dappId()).to.equal(await proxy1.dappId());
            expect(await productApi3ReaderProxyV1.dappId()).to.equal(await proxy2.dappId());
            expect(await productApi3ReaderProxyV1Compound.proxy1()).to.equal(await proxy1.getAddress());
            expect(await productApi3ReaderProxyV1Compound.proxy2()).to.equal(
              await productApi3ReaderProxyV1.getAddress()
            );
            expect(await productApi3ReaderProxyV1Compound.dappId()).to.equal(await proxy1.dappId());
            expect(await productApi3ReaderProxyV1Compound.dappId()).to.equal(await productApi3ReaderProxyV1.dappId());
          });
        });
        context('proxy1 is the same as proxy2', function () {
          it('reverts', async function () {
            const { proxy1, roles } = await helpers.loadFixture(deploy);
            const productApi3ReaderProxyV1Factory = await ethers.getContractFactory(
              'ProductApi3ReaderProxyV1',
              roles.deployer
            );
            await expect(productApi3ReaderProxyV1Factory.deploy(await proxy1.getAddress(), await proxy1.getAddress()))
              .to.be.revertedWithCustomError(productApi3ReaderProxyV1Factory, 'SameProxyAddress')
              .withArgs();
          });
        });
      });
      context('proxy2 is zero address', function () {
        it('reverts', async function () {
          const { proxy1, roles } = await helpers.loadFixture(deploy);
          const productApi3ReaderProxyV1Factory = await ethers.getContractFactory(
            'ProductApi3ReaderProxyV1',
            roles.deployer
          );
          await expect(productApi3ReaderProxyV1Factory.deploy(await proxy1.getAddress(), ethers.ZeroAddress))
            .to.be.revertedWithCustomError(productApi3ReaderProxyV1Factory, 'ZeroProxyAddress')
            .withArgs();
        });
      });
    });
    context('proxy1 is zero address', function () {
      it('reverts', async function () {
        const { proxy1, roles } = await helpers.loadFixture(deploy);
        const productApi3ReaderProxyV1Factory = await ethers.getContractFactory(
          'ProductApi3ReaderProxyV1',
          roles.deployer
        );
        await expect(productApi3ReaderProxyV1Factory.deploy(ethers.ZeroAddress, await proxy1.getAddress()))
          .to.be.revertedWithCustomError(productApi3ReaderProxyV1Factory, 'ZeroProxyAddress')
          .withArgs();
      });
    });
  });

  describe('read', function () {
    it('reads the product of the proxy rates', async function () {
      const { proxy1, proxy2, productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [baseBeaconValueEthUsd] = await proxy1.read();
      const [baseBeaconValueSolEth] = await proxy2.read();
      const dataFeed = await productApi3ReaderProxyV1.read();
      expect(dataFeed.value).to.equal((baseBeaconValueEthUsd * baseBeaconValueSolEth) / 10n ** 18n);
      expect(dataFeed.timestamp).to.equal(await helpers.time.latest());
    });
  });

  describe('latestAnswer', function () {
    it('returns proxy value', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [value] = await productApi3ReaderProxyV1.read();
      expect(await productApi3ReaderProxyV1.latestAnswer()).to.be.equal(value);
    });
  });

  describe('latestTimestamp', function () {
    it('returns proxy value', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [, timestamp] = await productApi3ReaderProxyV1.read();
      expect(await productApi3ReaderProxyV1.latestTimestamp()).to.be.equal(timestamp);
    });
  });

  describe('latestRound', function () {
    it('reverts', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      await expect(productApi3ReaderProxyV1.latestRound())
        .to.be.revertedWithCustomError(productApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('getAnswer', function () {
    it('reverts', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(productApi3ReaderProxyV1.getAnswer(blockNumber))
        .to.be.revertedWithCustomError(productApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('getTimestamp', function () {
    it('reverts', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(productApi3ReaderProxyV1.getTimestamp(blockNumber))
        .to.be.revertedWithCustomError(productApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('decimals', function () {
    it('returns 18', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      expect(await productApi3ReaderProxyV1.decimals()).to.equal(18);
    });
  });

  describe('description', function () {
    it('returns empty string', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      expect(await productApi3ReaderProxyV1.description()).to.equal('');
    });
  });

  describe('version', function () {
    it('returns 4914', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      expect(await productApi3ReaderProxyV1.version()).to.equal(4914);
    });
  });

  describe('getRoundData', function () {
    it('reverts', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const blockNumber = await ethers.provider.getBlockNumber();
      await expect(productApi3ReaderProxyV1.getRoundData(blockNumber))
        .to.be.revertedWithCustomError(productApi3ReaderProxyV1, 'FunctionIsNotSupported')
        .withArgs();
    });
  });

  describe('latestRoundData', function () {
    it('returns approximated round data', async function () {
      const { productApi3ReaderProxyV1 } = await helpers.loadFixture(deploy);
      const [value, timestamp] = await productApi3ReaderProxyV1.read();
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = await productApi3ReaderProxyV1.latestRoundData();
      expect(roundId).to.equal(0);
      expect(answer).to.equal(value);
      expect(startedAt).to.equal(timestamp);
      expect(updatedAt).to.equal(timestamp);
      expect(answeredInRound).to.equal(0);
    });
  });
});
