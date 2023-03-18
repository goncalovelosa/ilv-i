import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ILVIToken } from '../typechain-types'
import { TypedDataDomain, TypedDataField } from 'ethers/lib/ethers'

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
  let otherAccount: SignerWithAddress
  let otherAccountAddress: string
  let domain: TypedDataDomain
  let types: Record<string, Array<TypedDataField>>

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
    otherAccount = accounts[4]
    otherAccountAddress = otherAccount.address
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
      expect(await contract.connect(owner).mint(otherAccountAddress, 1000))
        .to.emit(contract, 'Transfer')
        .withArgs(ownerAddress, otherAccountAddress, 1000)
      expect(await contract.balanceOf(otherAccountAddress)).to.equal(1000)
      expect(await contract.isBlacklisted(otherAccountAddress)).to.equal(false)
    })

    it('Should not mint tokens if not owner', async function () {
      await expect(contract.connect(otherAccount).mint(otherAccountAddress, 1000)).to.be.revertedWith(
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
      await expect(contract.connect(otherAccount).burn(compromisedAccountAddress, 1000)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      )
    })
  })

  describe('Blacklist', function () {
    it('Should blacklist an address', async function () {
      expect(await contract.connect(owner).blacklistAddress(otherAccountAddress))
        .to.emit(contract, 'BlacklistedAddressAdded')
        .withArgs(otherAccountAddress)
      expect(await contract.isBlacklisted(blacklistedAccountAddress)).to.equal(true)
    })

    it('Should not blacklist an address if not owner', async function () {
      await expect(contract.connect(otherAccount).blacklistAddress(blacklistedAccountAddress)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      )
    })

    it('Should fail to execute transfer if recipient is blacklisted', async function () {
      await expect(contract.connect(compromisedAccount).transfer(blacklistedAccountAddress, 1000)).to.be.revertedWith(
        'ILVIToken: Recipient address is blacklisted.',
      )
    })
  })

  describe('Set backup address', function () {
    it('Should set backup address', async function () {
      expect(await contract.connect(compromisedAccount).setBackupAddress(backupAccountAddress))
        .to.emit(contract, 'BackupAddressSet')
        .withArgs(compromisedAccount, backupAccountAddress)
      expect(await contract.getBackupAddress(compromisedAccountAddress)).to.equal(backupAccountAddress)
    })

    it('Should fail to set if backup address is zero', async function () {
      await expect(
        contract.connect(compromisedAccount).setBackupAddress(ethers.constants.AddressZero),
      ).to.be.revertedWith('ILVIToken: backup address is the zero address')
    })

    it('Should fail to set if backup address is the caller address', async function () {
      await expect(contract.connect(compromisedAccount).setBackupAddress(compromisedAccountAddress)).to.be.revertedWith(
        'ILVIToken: backup address is the same as the sender',
      )
    })

    it('Should fail to set backup address if caller is blacklisted', async function () {
      await expect(contract.connect(blacklistedAccount).setBackupAddress(backupAccountAddress)).to.be.revertedWith(
        'ILVIToken: your account is blacklisted',
      )
    })

    it('Should fail to set backup address if backup address is already set to that same address', async function () {
      await contract.connect(compromisedAccount).setBackupAddress(backupAccountAddress)
      await expect(contract.connect(compromisedAccount).setBackupAddress(backupAccountAddress)).to.be.revertedWith(
        'ILVIToken: backup address is already set to that same address',
      )
    })

    it('Should fail to set if backup address is blacklisted', async function () {
      await expect(contract.connect(compromisedAccount).setBackupAddress(blacklistedAccountAddress)).to.be.revertedWith(
        'ILVIToken: backup address is blacklisted',
      )
    })
  })

  describe('Use Emergency Transfer', function () {
    beforeEach(async function () {
      const { chainId } = await ethers.provider.getNetwork()
      domain = {
        name: 'ILVIToken',
        version: '1',
        chainId,
        verifyingContract: contract.address,
      }

      types = {
        EmergencyTransfer: [
          {
            name: 'token',
            type: 'address',
          },
          {
            name: 'from',
            type: 'address',
          },
          {
            name: 'to',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint256',
          },
          {
            name: 'nonce',
            type: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      }
    })
    it('should transfer all tokens to the emergency address', async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const nonce = await contract.nonces(compromisedAccount.address)
      const initialBalance = await contract.balanceOf(compromisedAccountAddress)
      const message = {
        owner: compromisedAccount.address,
        backup: backupAccountAddress,
        deadline,
        nonce,
      }

      const signature = await compromisedAccount._signTypedData(domain, types, message)
      await contract.emergencyTransfer(nonce, deadline, signature)
      expect(await contract.balanceOf(compromisedAccountAddress)).to.equal(0)
      expect(await contract.balanceOf(backupAccountAddress)).to.equal(initialBalance)
      expect(await contract.blacklist(compromisedAccountAddress)).to.equal(true)
    })
  })
})
