import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-contract-sizer'
import 'dotenv/config'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-solhint'
import '@nomiclabs/hardhat-ethers/signers'

const alchemyKey = process.env.ALCHEMY_KEY
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
      url: `https://eth-goerli.g.alchemy.com/v2/${alchemyKey}`,
      chainId: 5,
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
    except: ['Counters', 'ERC20', 'ECDSA', 'Math', 'Strings'],
  },
}

export default config
