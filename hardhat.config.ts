import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
        enabled: true,
        url: process.env.ETH_MAINNET!,
        blockNumber: 19700289,
      },
    },
    sepolia: {
      url: process.env.ETH_SEPOLIA,
      accounts: [process.env.DEPLOY_KEY!],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API!,
    },
  },
};

task("verifySwapper", "verifies swapper").setAction(async ({}, hre) => {
  await hre.run("verify:verify", {
    address: "0xBa2C7AB80B0A2E79aA04e9F29466409f5CEd1C1A",
  });
});

export default config;
