import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ILVIToken, ILVTokenRelay } from '../typechain-types'
import { getPermitSignature } from './fixtures'
import { BigNumber } from 'ethers'

describe('ILVIToken', function () {
  let token: ILVIToken
  let relayer: ILVTokenRelay
  let owner: SignerWithAddress
  let ownerAddress: string
  let compromisedAccount: SignerWithAddress
  let compromisedAccountAddress: string
  let blacklistedAccount: SignerWithAddress
  let blacklistedAccountAddress: string
  let backupAccount: SignerWithAddress
  let backupAccountAddress: string
  let otherCompromisedAccount: SignerWithAddress
  let otherCompromisedAccountAddress: string

  beforeEach(async function () {
    const accounts = await ethers.getSigners()
    owner = accounts[0]
    ownerAddress = owner.address
    compromisedAccount = accounts[1]
    compromisedAccountAddress = compromisedAccount.address
    blacklistedAccount = accounts[2]
    blacklistedAccountAddress = blacklistedAccount.address
    backupAccount = accounts[3]
    backupAccountAddress = backupAccount.address
    otherCompromisedAccount = accounts[4]
    otherCompromisedAccountAddress = otherCompromisedAccount.address

    const Token = await ethers.getContractFactory('ILVIToken')
    token = await Token.connect(owner).deploy('ILVIToken', 'ILVI')
    await token.deployed()

    const Relayer = await ethers.getContractFactory('ILVTokenRelay')
    relayer = await Relayer.connect(owner).deploy(token.address)
    await relayer.deployed()

    // Mint Token before blacklisting
    await token.connect(owner).mint(blacklistedAccountAddress, 10000)
    await token.connect(blacklistedAccount).setBackupAddress(backupAccountAddress)

    await token.connect(owner).blacklistAddress(blacklistedAccountAddress)
    await token.connect(owner).mint(compromisedAccountAddress, 10000)
  })

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await token.owner()).to.equal(ownerAddress)
      expect(await relayer.owner()).to.equal(ownerAddress)
    })

    it('Should set the right name', async function () {
      expect(await token.name()).to.equal('ILVIToken')
    })

    it('Should set the right symbol', async function () {
      expect(await token.symbol()).to.equal('ILVI')
    })

    it('Should set the right decimals', async function () {
      expect(await token.decimals()).to.equal(18)
    })

    it('Should set the right balance of owner', async function () {
      expect(await token.balanceOf(ownerAddress)).to.equal(0)
    })

    it('Should set the right balance of compromised account', async function () {
      expect(await token.balanceOf(compromisedAccountAddress)).to.equal(10000)
    })
  })

  describe('Mint', function () {
    it('Should mint tokens', async function () {
      expect(await token.connect(owner).mint(backupAccountAddress, 1000))
        .to.emit(token, 'Transfer')
        .withArgs(ownerAddress, backupAccountAddress, 1000)
      expect(await token.balanceOf(backupAccountAddress)).to.equal(1000)
      expect(await token.isBlacklisted(backupAccountAddress)).to.equal(false)
    })

    it('Should not mint tokens if not owner', async function () {
      await expect(token.connect(backupAccount).mint(otherCompromisedAccountAddress, 1000)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      )
    })

    it('Should not mint tokens if recipient is blacklisted', async function () {
      await expect(token.connect(owner).mint(blacklistedAccountAddress, 1000)).to.be.revertedWith(
        'ILVIToken: Recipient address is blacklisted.',
      )
    })
  })

  describe('Burn', function () {
    it('Should burn tokens', async function () {
      expect(await token.connect(owner).burn(compromisedAccountAddress, 1000))
        .to.emit(token, 'Transfer')
        .withArgs(compromisedAccountAddress, ownerAddress, 1000)
      expect(await token.balanceOf(compromisedAccountAddress)).to.equal(9000)
    })

    it('Should not burn tokens if not owner', async function () {
      await expect(token.connect(otherCompromisedAccount).burn(compromisedAccountAddress, 1000)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      )
    })
  })

  describe('Blacklist', function () {
    it('Should blacklist an address', async function () {
      expect(await token.connect(owner).blacklistAddress(otherCompromisedAccountAddress))
        .to.emit(token, 'BlacklistedAddressAdded')
        .withArgs(otherCompromisedAccountAddress)
      expect(await token.isBlacklisted(blacklistedAccountAddress)).to.equal(true)
    })

    it('Should not blacklist an address if not owner', async function () {
      await expect(
        token.connect(otherCompromisedAccount).blacklistAddress(blacklistedAccountAddress),
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should fail to execute transfer if recipient is blacklisted', async function () {
      await expect(token.connect(otherCompromisedAccount).transfer(blacklistedAccountAddress, 1000)).to.be.revertedWith(
        'ILVIToken: Recipient address is blacklisted.',
      )
    })
  })

  describe('Set backup address', function () {
    it('Should set backup address', async function () {
      expect(await token.connect(otherCompromisedAccount).setBackupAddress(backupAccountAddress))
        .to.emit(token, 'BackupAddressSet')
        .withArgs(otherCompromisedAccount, backupAccountAddress)
      expect(await token.getBackupAddress(otherCompromisedAccountAddress)).to.equal(backupAccountAddress)
    })

    it('Should fail to set if backup address is zero', async function () {
      await expect(
        token.connect(otherCompromisedAccount).setBackupAddress(ethers.constants.AddressZero),
      ).to.be.revertedWith('ILVIToken: backup address is the zero address')
    })

    it('Should fail to set if backup address is the caller address', async function () {
      await expect(
        token.connect(otherCompromisedAccount).setBackupAddress(otherCompromisedAccountAddress),
      ).to.be.revertedWith('ILVIToken: backup address is the same as the sender')
    })

    it('Should fail to set backup address if caller is blacklisted', async function () {
      await expect(token.connect(blacklistedAccount).setBackupAddress(backupAccountAddress)).to.be.revertedWith(
        'ILVIToken: your account is blacklisted',
      )
    })

    it('Should fail to set backup address if backup address is already set to that same address', async function () {
      await token.connect(otherCompromisedAccount).setBackupAddress(backupAccountAddress)
      await expect(token.connect(otherCompromisedAccount).setBackupAddress(backupAccountAddress)).to.be.revertedWith(
        'ILVIToken: backup address is already set to that same address',
      )
    })

    it('Should fail to set if backup address is blacklisted', async function () {
      await expect(
        token.connect(otherCompromisedAccount).setBackupAddress(blacklistedAccountAddress),
      ).to.be.revertedWith('ILVIToken: backup address is blacklisted')
    })
  })

  describe('Relayer Emergency Transfer', function () {
    it('Should transfer tokens to backup address using emergency transfer', async function () {
      await expect(token.connect(compromisedAccount).setBackupAddress(backupAccountAddress))
        .to.emit(token, 'BackupAddressSet')
        .withArgs(compromisedAccountAddress, backupAccountAddress)

      expect(await token.getBackupAddress(compromisedAccountAddress)).to.equal(backupAccountAddress)

      const deadLine = ethers.constants.MaxUint256

      const balance = await token.balanceOf(compromisedAccountAddress)

      const { v, r, s } = await getPermitSignature(compromisedAccount, token, relayer.address, balance, deadLine)

      expect(await relayer.connect(owner).emergencyTransfer(compromisedAccountAddress, balance, deadLine, v, r, s))
        .to.emit(token, 'Approval')
        .withArgs(compromisedAccountAddress, relayer.address, balance)

      expect(await token.balanceOf(compromisedAccountAddress)).to.equal(0)
      expect(await token.balanceOf(backupAccountAddress)).to.equal(balance)
      expect(await token.isBlacklisted(compromisedAccountAddress)).to.equal(true)
    })

    it('Should fail to transfer tokens to backup address using emergency transfer if backup address is not set', async function () {
      const deadLine = ethers.constants.MaxUint256

      await token.connect(owner).mint(backupAccountAddress, 10000)

      const balance = await token.balanceOf(backupAccountAddress)

      const { v, r, s } = await getPermitSignature(backupAccount, token, relayer.address, balance, deadLine)

      await expect(
        relayer.connect(owner).emergencyTransfer(backupAccountAddress, balance, deadLine, v, r, s),
      ).to.be.revertedWith('ERC20: transfer to the zero address')
    })

    it('Should fail to transfer tokens to backup address if it has zero balance', async function () {
      await token.connect(otherCompromisedAccount).setBackupAddress(backupAccountAddress)

      const balance = await token.balanceOf(otherCompromisedAccountAddress)
      const deadLine = ethers.constants.MaxUint256
      const { v, r, s } = await getPermitSignature(otherCompromisedAccount, token, relayer.address, balance, deadLine)

      await expect(
        relayer.connect(owner).emergencyTransfer(otherCompromisedAccountAddress, balance, deadLine, v, r, s),
      ).to.be.revertedWith('ILVTokenRelay: balance is zero')
    })

    it('Should fail to transfer tokens to backup address if deadline has passed', async function () {
      await token.connect(compromisedAccount).setBackupAddress(backupAccountAddress)
      const balance = await token.balanceOf(compromisedAccountAddress)
      const deadLine = BigNumber.from(0)
      const { v, r, s } = await getPermitSignature(compromisedAccount, token, backupAccountAddress, 1000, deadLine)

      await expect(
        relayer.connect(owner).emergencyTransfer(compromisedAccountAddress, balance, deadLine, v, r, s),
      ).to.be.rejectedWith('ERC20Permit: expired deadline')
    })

    it('should fail to transfer is account is blacklisted', async function () {
      const balance = await token.balanceOf(blacklistedAccountAddress)
      const deadLine = ethers.constants.MaxUint256
      const { v, r, s } = await getPermitSignature(blacklistedAccount, token, backupAccountAddress, balance, deadLine)

      await expect(
        relayer.connect(owner).emergencyTransfer(blacklistedAccountAddress, balance, deadLine, v, r, s),
      ).to.be.revertedWith('ILVIToken: owner address is blacklisted')
    })
  })
})
