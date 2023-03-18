import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-contract-sizer'
import 'dotenv/config'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-solhint'

const alchemyKey = process.env.ALCHEMY_KEY

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: '0.8.18',
  networks: {
    ganache: {
      url: 'http://localhost:8545',
      gasPrice: 20000000000,
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${alchemyKey}`,
      chainId: 5,
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
    only: ['ILVIToken.sol'],
  },
}

export default config
