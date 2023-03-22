import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-contract-sizer'
import 'dotenv/config'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-solhint'
import '@nomiclabs/hardhat-ethers/signers'

const goerliAlchemyKey = process.env.ALCHEMY_KEY_GOERLI
const sepoliaAlchemyKey = process.env.ALCHEMY_KEY_SEPOLIA
const cmcKey = process.env.COINMARKETCAP_API_KEY

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: '0.8.18',
  networks: {
    ganache: {
      url: 'http://localhost:8545',
      gasPrice: 20000000000,
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${goerliAlchemyKey}`,
      chainId: 5,
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${sepoliaAlchemyKey}`,
      chainId: 11155111,
    },
  },
  gasReporter: {
    enabled: cmcKey ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    showTimeSpent: true,
    currency: 'EUR',
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
    except: ['Counters', 'ERC20.sol', 'ECDSA', 'Math', 'Strings'],
  },
}

export default config
