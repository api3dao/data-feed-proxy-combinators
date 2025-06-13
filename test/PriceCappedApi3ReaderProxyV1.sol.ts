import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import * as helpers from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import * as testUtils from './test-utils';

describe('PriceCappedApi3ReaderProxyV1', function () {
  async function deploy() {
    const roleNames = ['deployer', 'manager', 'airnode', 'auctioneer', 'searcher'];
    const accounts = await ethers.getSigners();
    const roles: Record<string, HardhatEthersSigner> = roleNames.reduce((acc, roleName, index) => {
      return { ...acc, [roleName]: accounts[index] };
    }, {});

    const accessControlRegistryFactory = await ethers.getContractFactory('AccessControlRegistry', roles.deployer);
    const accessControlRegistry = await accessControlRegistryFactory.deploy();

    const api3ServerV1Factory = await ethers.getContractFactory('Api3ServerV1', roles.deployer);
    const api3ServerV1 = await api3ServerV1Factory.deploy(
      accessControlRegistry.getAddress(),
      'Api3ServerV1 admin',
      roles.manager!.address
    );

    const api3ServerV1OevExtensionAdminRoleDescription = 'Api3ServerV1OevExtension admin';
    const api3ServerV1OevExtensionFactory = await ethers.getContractFactory('Api3ServerV1OevExtension', roles.deployer);
    const api3ServerV1OevExtension = await api3ServerV1OevExtensionFactory.deploy(
      accessControlRegistry.getAddress(),
      api3ServerV1OevExtensionAdminRoleDescription,
      roles.manager!.address,
      api3ServerV1.getAddress()
    );

    const dapiName = ethers.encodeBytes32String('DAI/USD');
    const dappId = 1;

    const api3ReaderProxyV1Factory = await ethers.getContractFactory('Api3ReaderProxyV1', roles.deployer);
    const api3ReaderProxyV1 = await api3ReaderProxyV1Factory.deploy(
      api3ServerV1OevExtension.getAddress(),
      dapiName,
      dappId
    );

    const endpointId = testUtils.generateRandomBytes32();
    const templateParameters = testUtils.generateRandomBytes();
    const templateId = ethers.keccak256(ethers.solidityPacked(['bytes32', 'bytes'], [endpointId, templateParameters]));
    const beaconId = ethers.keccak256(
      ethers.solidityPacked(['address', 'bytes32'], [roles.airnode!.address, templateId])
    );
    await api3ServerV1.connect(roles.manager).setDapiName(dapiName, beaconId);

    const baseBeaconValue = ethers.parseEther('1.0001');
    const baseBeaconTimestamp = await helpers.time.latest();
    const data = ethers.AbiCoder.defaultAbiCoder().encode(['int256'], [baseBeaconValue]);
    const signature = await testUtils.signData(roles.airnode! as any, templateId, baseBeaconTimestamp, data);
    await api3ServerV1.updateBeaconWithSignedData(
      roles.airnode!.address,
      templateId,
      baseBeaconTimestamp,
      data,
      signature
    );

    const lowerBound = ethers.parseEther('0.9995');
    const upperBound = ethers.parseEther('1.0005');

    const priceCappedApi3ReaderProxyV1Factory = await ethers.getContractFactory(
      'PriceCappedApi3ReaderProxyV1',
      roles.deployer
    );
    const priceCappedApi3ReaderProxyV1 = await priceCappedApi3ReaderProxyV1Factory.deploy(
      await api3ReaderProxyV1.getAddress(),
      lowerBound,
      upperBound
    );

    return {
      api3ServerV1,
      api3ReaderProxyV1,
      priceCappedApi3ReaderProxyV1,
      lowerBound,
      upperBound,
      templateId,
      roles,
    };
  }

  describe('constructor', function () {
    context('proxy is not zero address', function () {
      context('lowerBound is not negative', function () {
        context('upperBound is greater or  equal to lowerBound', function () {
          it('constructs', async function () {
            const { api3ReaderProxyV1, priceCappedApi3ReaderProxyV1, lowerBound, upperBound } =
              await helpers.loadFixture(deploy);
            expect(await priceCappedApi3ReaderProxyV1.proxy()).to.equal(await api3ReaderProxyV1.getAddress());
            expect(await priceCappedApi3ReaderProxyV1.lowerBound()).to.equal(lowerBound);
            expect(await priceCappedApi3ReaderProxyV1.upperBound()).to.equal(upperBound);
          });
        });
        context('upperBound is less than lowerBound', function () {
          it('reverts', async function () {
            const { api3ReaderProxyV1, lowerBound, upperBound, roles } = await helpers.loadFixture(deploy);
            const priceCappedApi3ReaderProxyV1 = await ethers.getContractFactory(
              'PriceCappedApi3ReaderProxyV1',
              roles.deployer
            );
            await expect(priceCappedApi3ReaderProxyV1.deploy(api3ReaderProxyV1, upperBound, lowerBound))
              .to.be.revertedWithCustomError(priceCappedApi3ReaderProxyV1, 'UpperBoundMustBeGreaterOrEqualToLowerBound')
              .withArgs();
          });
        });
      });
      context('lowerBound is negative', function () {
        it('reverts', async function () {
          const { api3ReaderProxyV1, upperBound, roles } = await helpers.loadFixture(deploy);
          const priceCappedApi3ReaderProxyV1 = await ethers.getContractFactory(
            'PriceCappedApi3ReaderProxyV1',
            roles.deployer
          );
          await expect(priceCappedApi3ReaderProxyV1.deploy(api3ReaderProxyV1, ethers.parseEther('-0.9995'), upperBound))
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
      const {
        api3ServerV1,
        api3ReaderProxyV1,
        priceCappedApi3ReaderProxyV1,
        templateId,
        lowerBound,
        upperBound,
        roles,
      } = await helpers.loadFixture(deploy);
      const dataFeed = await priceCappedApi3ReaderProxyV1.read();

      const [value, timestamp] = await api3ReaderProxyV1.read();
      expect(dataFeed.value).to.equal(value);
      expect(dataFeed.timestamp).to.equal(timestamp);

      let data = ethers.AbiCoder.defaultAbiCoder().encode(['int256'], [ethers.parseEther('0.9991')]);
      let beaconTimestamp = await helpers.time.latest();
      let signature = await testUtils.signData(roles.airnode! as any, templateId, beaconTimestamp, data);
      await api3ServerV1.updateBeaconWithSignedData(
        roles.airnode!.address,
        templateId,
        beaconTimestamp,
        data,
        signature
      );
      const cappedToLowerBoundDataFeed = await priceCappedApi3ReaderProxyV1.read();
      expect(cappedToLowerBoundDataFeed.value).to.equal(lowerBound);
      expect(cappedToLowerBoundDataFeed.timestamp).to.equal(beaconTimestamp);

      data = ethers.AbiCoder.defaultAbiCoder().encode(['int256'], [ethers.parseEther('1.0006')]);
      beaconTimestamp = await helpers.time.latest();
      signature = await testUtils.signData(roles.airnode! as any, templateId, beaconTimestamp, data);
      await api3ServerV1.updateBeaconWithSignedData(
        roles.airnode!.address,
        templateId,
        beaconTimestamp,
        data,
        signature
      );
      const cappedToUpperBoundDataFeed = await priceCappedApi3ReaderProxyV1.read();
      expect(cappedToUpperBoundDataFeed.value).to.equal(upperBound);
      expect(cappedToUpperBoundDataFeed.timestamp).to.equal(beaconTimestamp);
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
