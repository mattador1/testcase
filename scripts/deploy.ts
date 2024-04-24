import { ethers, upgrades } from "hardhat";
import { CONTRACTS_SEPOLIA } from "./helpers";

(async () => {
  const network = await ethers.provider.getNetwork();

  if (network.name !== "sepolia") {
    throw new Error("Only sepolia  network is supported");
  }

  const CONTRACTS = CONTRACTS_SEPOLIA;

  const signers = await ethers.getSigners();
  const Swapper = await ethers.getContractFactory("Swapper");

  const caller = signers[0];

  const beforeETH = await ethers.provider.getBalance(caller.address);

  const swapper = await upgrades.deployProxy(
    Swapper,
    [
      CONTRACTS.WETH,
      CONTRACTS.WETH_FEED,
      CONTRACTS.AAVE_ORACLE,
      CONTRACTS.UNISWAP_FACTORY,
      CONTRACTS.SWAP_ROUTER,
    ],
    { kind: "uups" }
  );

  const deploymentTx = swapper.deploymentTransaction();

  await swapper.waitForDeployment();

  const afterETH = await ethers.provider.getBalance(caller.address);

  const diff = beforeETH - afterETH;

  console.log("Gas units for deployment:", diff / deploymentTx!.gasPrice);

  console.log("Swapper deployed at:", await swapper.getAddress());
})();
