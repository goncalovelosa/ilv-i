import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { getEmergencyTransferSignature } from './fixtures'
import { ERC20Backup } from '../typechain-types/contracts/ERC20Backup'
import { BigNumber } from 'ethers'

describe('ERC20Backup', function () {
  let token: ERC20Backup
  const version = '1'
  let owner: SignerWithAddress
  let compromisedAccount: SignerWithAddress
  let compromisedBackupAccount: SignerWithAddress
  let otherAccount: SignerWithAddress

  beforeEach(async function () {
    ;[owner, compromisedAccount, otherAccount, compromisedBackupAccount] = await ethers.getSigners()
    const tokenFactory = await ethers.getContractFactory('ERC20Backup')
    token = await tokenFactory.connect(owner).deploy('ILVIToken', 'ILVI', version)
    await token.deployed()

    await token.connect(owner).mint(compromisedAccount.address, 10000)
    await token.connect(owner).mint(otherAccount.address, 10000)
  })

  describe('Emergency Transfer', function () {
    it('Should transfer tokens to backup address using emergency transfer', async function () {
      expect(await token.connect(compromisedAccount).registerEmergencyBackupAddress(compromisedBackupAccount.address))
        .to.emit(token, 'EmergencyBackupRegistered')
        .withArgs(compromisedAccount.address, compromisedBackupAccount.address)
      const deadLine = ethers.constants.MaxUint256

      const balance = await token.balanceOf(compromisedAccount.address)
      const { v, r, s } = await getEmergencyTransferSignature(compromisedAccount, version, token, balance, deadLine)

      expect(await token.connect(owner).emergencyTransfer(compromisedAccount.address, deadLine, v, r, s))
        .to.emit(token, 'Approval')
        .withArgs(compromisedAccount.address, owner.address, balance)
        .to.emit(token, 'Transfer')
        .withArgs(compromisedAccount.address, compromisedBackupAccount.address, balance)

      expect(await token.balanceOf(compromisedAccount.address)).to.equal(0)
      expect(await token.balanceOf(compromisedBackupAccount.address)).to.equal(balance)
      expect(await token.isBlacklisted(compromisedAccount.address)).to.equal(true)
    })

    it('Should fail to transfer tokens after address has been marked as blacklisted', async function () {
      await token.connect(compromisedAccount).registerEmergencyBackupAddress(compromisedBackupAccount.address)
      await token.connect(otherAccount).registerEmergencyBackupAddress(compromisedAccount.address)

      // Transfer tokens from compromised account to backup account
      const compromisedAccountBalance = await token.balanceOf(compromisedAccount.address)
      const deadLine = ethers.constants.MaxUint256
      const {
        v: compromisedV,
        r: compromisedR,
        s: compromisedS,
      } = await getEmergencyTransferSignature(compromisedAccount, version, token, compromisedAccountBalance, deadLine)
      await token
        .connect(owner)
        .emergencyTransfer(compromisedAccount.address, deadLine, compromisedV, compromisedR, compromisedS)

      // Transfer tokens from other account to compromised account (blacklisted)
      const otherAccountBalance = await token.balanceOf(otherAccount.address)
      const { v, r, s } = await getEmergencyTransferSignature(
        otherAccount,
        version,
        token,
        otherAccountBalance,
        deadLine,
      )

      await expect(token.connect(owner).emergencyTransfer(otherAccount.address, deadLine, v, r, s)).to.be.revertedWith(
        'Recipient address is blacklisted',
      )
    })

    it('Should fail transfer tokens to backup address using emergency transfer when signature is invalid', async function () {
      await token.connect(compromisedAccount).registerEmergencyBackupAddress(compromisedBackupAccount.address)
      const deadLine = ethers.constants.MaxUint256

      const balance = BigNumber.from(10)

      const { v, r, s } = await getEmergencyTransferSignature(compromisedAccount, version, token, balance, deadLine)

      await expect(
        token.connect(owner).emergencyTransfer(compromisedAccount.address, deadLine, v, r, s),
      ).to.be.revertedWith('Invalid signature')
    })

    it('Should not transfer tokens to backup address using emergency transfer if deadline has passed', async function () {
      await token.connect(compromisedAccount).registerEmergencyBackupAddress(compromisedBackupAccount.address)
      const deadLine = BigNumber.from(0)

      const balance = await token.balanceOf(compromisedAccount.address)
      const { v, r, s } = await getEmergencyTransferSignature(compromisedAccount, version, token, balance, deadLine)

      await expect(
        token.connect(owner).emergencyTransfer(compromisedAccount.address, deadLine, v, r, s),
      ).to.be.revertedWith('Transfer deadline has passed')
    })

    it('Should not transfer tokens to backup address using emergency transfer if backup address is not registered', async function () {
      const deadLine = ethers.constants.MaxUint256

      const balance = await token.balanceOf(compromisedAccount.address)
      const { v, r, s } = await getEmergencyTransferSignature(compromisedAccount, version, token, balance, deadLine)

      await expect(
        token.connect(owner).emergencyTransfer(compromisedAccount.address, deadLine, v, r, s),
      ).to.be.revertedWith('ERC20: transfer to the zero address')
    })
  })

  describe('Register Emergency Backup Address', function () {
    it('Should register emergency backup address', async function () {
      expect(await token.connect(compromisedAccount).registerEmergencyBackupAddress(compromisedBackupAccount.address))
        .to.emit(token, 'EmergencyBackupRegistered')
        .withArgs(compromisedAccount.address, compromisedBackupAccount.address)
    })

    it('Should fail to register emergency backup address if address is the same', async function () {
      await expect(
        token.connect(compromisedAccount).registerEmergencyBackupAddress(compromisedAccount.address),
      ).to.be.revertedWith('Backup address cannot be the same as the token holder')
    })

    it('Should fail to register emergency backup address as zero address', async function () {
      await expect(
        token.connect(compromisedAccount).registerEmergencyBackupAddress(ethers.constants.AddressZero),
      ).to.be.revertedWith('Backup address cannot be the zero address')
    })

    it('Should fail to register emergency backup address if address is blacklisted', async function () {
      await token.connect(compromisedAccount).registerEmergencyBackupAddress(compromisedBackupAccount.address)
      await token.connect(otherAccount).registerEmergencyBackupAddress(compromisedAccount.address)
      const compromisedAccountBalance = await token.balanceOf(compromisedAccount.address)
      const deadLine = ethers.constants.MaxUint256
      const { v, r, s } = await getEmergencyTransferSignature(
        compromisedAccount,
        version,
        token,
        compromisedAccountBalance,
        deadLine,
      )
      await token.connect(owner).emergencyTransfer(compromisedAccount.address, deadLine, v, r, s)

      await expect(
        token.connect(otherAccount).registerEmergencyBackupAddress(compromisedAccount.address),
      ).to.be.revertedWith('Backup address is blacklisted')
    })
  })
})
