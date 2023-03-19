import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ILVIToken } from '../typechain-types'

describe('ILVIToken', function () {
  let contract: ILVIToken
  let owner: SignerWithAddress
  let ownerAddress: string
  let compromisedAccount: SignerWithAddress
  let compromisedAccountAddress: string
  let blacklistedAccount: SignerWithAddress
  let blacklistedAccountAddress: string
  let backupAccount: SignerWithAddress
  let backupAccountAddress: string
  let otherBackupAccount: SignerWithAddress
  let otherBackupAccountAddress: string
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
    otherBackupAccount = accounts[5]
    otherBackupAccountAddress = otherBackupAccount.address
    const Token = await ethers.getContractFactory('ILVIToken')
    contract = await Token.deploy('ILVIToken', 'ILVI')
    await contract.deployed()

    await contract.connect(owner).blacklistAddress(blacklistedAccountAddress)
    await contract.connect(owner).mint(compromisedAccountAddress, 10000)
  })

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await contract.owner()).to.equal(ownerAddress)
    })

    it('Should set the right name', async function () {
      expect(await contract.name()).to.equal('ILVIToken')
    })

    it('Should set the right symbol', async function () {
      expect(await contract.symbol()).to.equal('ILVI')
    })

    it('Should set the right decimals', async function () {
      expect(await contract.decimals()).to.equal(18)
    })

    it('Should set the right balance of owner', async function () {
      expect(await contract.balanceOf(ownerAddress)).to.equal(0)
    })

    it('Should set the right balance of compromised account', async function () {
      expect(await contract.balanceOf(compromisedAccountAddress)).to.equal(10000)
    })
  })

  describe('Mint', function () {
    it('Should mint tokens', async function () {
      expect(await contract.connect(owner).mint(backupAccountAddress, 1000))
        .to.emit(contract, 'Transfer')
        .withArgs(ownerAddress, backupAccountAddress, 1000)
      expect(await contract.balanceOf(backupAccountAddress)).to.equal(1000)
      expect(await contract.isBlacklisted(backupAccountAddress)).to.equal(false)
    })

    it('Should not mint tokens if not owner', async function () {
      await expect(contract.connect(backupAccount).mint(otherCompromisedAccountAddress, 1000)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      )
    })

    it('Should not mint tokens if recipient is blacklisted', async function () {
      await expect(contract.connect(owner).mint(blacklistedAccountAddress, 1000)).to.be.revertedWith(
        'ILVIToken: Recipient address is blacklisted.',
      )
    })
  })

  describe('Burn', function () {
    it('Should burn tokens', async function () {
      expect(await contract.connect(owner).burn(compromisedAccountAddress, 1000))
        .to.emit(contract, 'Transfer')
        .withArgs(compromisedAccountAddress, ownerAddress, 1000)
      expect(await contract.balanceOf(compromisedAccountAddress)).to.equal(9000)
    })

    it('Should not burn tokens if not owner', async function () {
      await expect(contract.connect(otherCompromisedAccount).burn(compromisedAccountAddress, 1000)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      )
    })
  })

  describe('Blacklist', function () {
    it('Should blacklist an address', async function () {
      expect(await contract.connect(owner).blacklistAddress(otherCompromisedAccountAddress))
        .to.emit(contract, 'BlacklistedAddressAdded')
        .withArgs(otherCompromisedAccountAddress)
      expect(await contract.isBlacklisted(blacklistedAccountAddress)).to.equal(true)
    })

    it('Should not blacklist an address if not owner', async function () {
      await expect(
        contract.connect(otherCompromisedAccount).blacklistAddress(blacklistedAccountAddress),
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should fail to execute transfer if recipient is blacklisted', async function () {
      await expect(
        contract.connect(otherCompromisedAccount).transfer(blacklistedAccountAddress, 1000),
      ).to.be.revertedWith('ILVIToken: Recipient address is blacklisted.')
    })
  })

  describe('Set backup address', function () {
    it('Should set backup address', async function () {
      expect(await contract.connect(otherCompromisedAccount).setBackupAddress(backupAccountAddress))
        .to.emit(contract, 'BackupAddressSet')
        .withArgs(otherCompromisedAccount, backupAccountAddress)
      expect(await contract.getBackupAddress(otherCompromisedAccountAddress)).to.equal(backupAccountAddress)
    })

    it('Should fail to set if backup address is zero', async function () {
      await expect(
        contract.connect(otherCompromisedAccount).setBackupAddress(ethers.constants.AddressZero),
      ).to.be.revertedWith('ILVIToken: backup address is the zero address')
    })

    it('Should fail to set if backup address is the caller address', async function () {
      await expect(
        contract.connect(otherCompromisedAccount).setBackupAddress(otherCompromisedAccountAddress),
      ).to.be.revertedWith('ILVIToken: backup address is the same as the sender')
    })

    it('Should fail to set backup address if caller is blacklisted', async function () {
      await expect(contract.connect(blacklistedAccount).setBackupAddress(backupAccountAddress)).to.be.revertedWith(
        'ILVIToken: your account is blacklisted',
      )
    })

    it('Should fail to set backup address if backup address is already set to that same address', async function () {
      await contract.connect(otherCompromisedAccount).setBackupAddress(backupAccountAddress)
      await expect(contract.connect(otherCompromisedAccount).setBackupAddress(backupAccountAddress)).to.be.revertedWith(
        'ILVIToken: backup address is already set to that same address',
      )
    })

    it('Should fail to set if backup address is blacklisted', async function () {
      await expect(
        contract.connect(otherCompromisedAccount).setBackupAddress(blacklistedAccountAddress),
      ).to.be.revertedWith('ILVIToken: backup address is blacklisted')
    })
  })
})
