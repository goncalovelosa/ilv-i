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
  let blacklistedAccount: SignerWithAddress
  let backupAccount: SignerWithAddress

  beforeEach(async function () {
    ;[owner, compromisedAccount, blacklistedAccount, backupAccount] = await ethers.getSigners()
    const tokenFactory = await ethers.getContractFactory('ERC20Backup')
    token = await tokenFactory.connect(owner).deploy('ILVIToken', 'ILVI', version)
    await token.deployed()

    await token.connect(owner).mint(compromisedAccount.address, 10000)
    await token.connect(owner).mint(blacklistedAccount.address, 10000)
  })

  describe('Emergency Transfer', function () {
    it('Should transfer tokens to backup address using emergency transfer', async function () {
      await token.connect(compromisedAccount).registerEmergencyBackupAddress(backupAccount.address)
      const deadLine = ethers.constants.MaxUint256

      const balance = await token.balanceOf(compromisedAccount.address)
      const { v, r, s } = await getEmergencyTransferSignature(compromisedAccount, version, token, balance, deadLine)

      expect(await token.connect(owner).emergencyTransfer(compromisedAccount.address, deadLine, v, r, s))
        .to.emit(token, 'Approval')
        .withArgs(compromisedAccount.address, owner.address, balance)
        .to.emit(token, 'Transfer')
        .withArgs(compromisedAccount.address, backupAccount.address, balance)

      expect(await token.balanceOf(compromisedAccount.address)).to.equal(0)
      expect(await token.balanceOf(backupAccount.address)).to.equal(balance)
      expect(await token.isBlacklisted(compromisedAccount.address)).to.equal(true)
    })

    it('Should fail transfer tokens to backup address using emergency transfer when signature is invalid', async function () {
      await token.connect(compromisedAccount).registerEmergencyBackupAddress(backupAccount.address)
      const deadLine = ethers.constants.MaxUint256

      const balance = BigNumber.from(10)

      const { v, r, s } = await getEmergencyTransferSignature(compromisedAccount, version, token, balance, deadLine)

      await expect(
        token.connect(owner).emergencyTransfer(compromisedAccount.address, deadLine, v, r, s),
      ).to.be.revertedWith('Invalid signature')
    })

    it('Should not transfer tokens to backup address using emergency transfer if deadline has passed', async function () {
      await token.connect(compromisedAccount).registerEmergencyBackupAddress(backupAccount.address)
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
      ).to.be.revertedWith('No emergency backup address registered')
    })
  })
})
