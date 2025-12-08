require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: './openqura/.env' });

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 30000000000, // 30 gwei
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./openqura/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
