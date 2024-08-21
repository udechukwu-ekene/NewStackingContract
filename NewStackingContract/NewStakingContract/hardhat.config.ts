import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();
import { HardhatUserConfig } from "hardhat/config";
import type { NetworkUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter"

const bscTestnet: NetworkUserConfig = {
  url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  chainId: 97,
  accounts: [process.env.HARDHAT_TESTNET_KEY!]
};

const bscMainnet: NetworkUserConfig = {
  url: "https://bsc-dataseed.binance.org/",
  chainId: 56,
  accounts: [process.env.HARDHAT_MAINNET_KEY!],
};

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {},
    testnet: bscTestnet,
    mainnet: bscMainnet,
  },
  gasReporter: {
    enabled: true
  },
  etherscan: {
    apiKey: process.env.HARDHAT_BSCSCAN_API_KEY
  },
};

export default config;
