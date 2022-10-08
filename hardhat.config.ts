import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  etherscan: {
    apiKey: process.env.ETHERSCAN_API
  },
  networks: {
    mainnet: {
      url: process.env.MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY ?? ""]
    },
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: [process.env.PRIVATE_KEY ?? ""]
    },
    bsc_test: {
      url: process.env.BSC_TESTNET,
      accounts: [process.env.PRIVATE_KEY ?? ""]
    }
  }
};

export default config;
