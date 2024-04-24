import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import { Swapper } from "../typechain-types";
import { CONTRACTS_MAINNET } from "../scripts/helpers";

describe("Swapper", function () {
  it("Deploy and swap", async () => {
    console.log("Swap 1 ETH to DAI");

    const network = await ethers.provider.getNetwork();

    if (network.name !== "hardhat") {
      throw new Error("Only local hardhat network is supported for testing");
    }

    const CONTRACTS = CONTRACTS_MAINNET;

    const signers = await ethers.getSigners();
    const Swapper = await ethers.getContractFactory("Swapper");

    const beforeETH = await ethers.provider.getBalance(signers[0].address);

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

    const afterETH = await ethers.provider.getBalance(signers[0].address);

    const diff = beforeETH - afterETH;

    console.log("Gas units for deployment:", diff / deploymentTx!.gasPrice);

    console.log("Swapper deployed at:", await swapper.getAddress());

    const swapperCtr = swapper as unknown as Swapper;

    // swap for DAI
    const dai = await ethers.getContractAt("IERC20", CONTRACTS.DAI);

    let tx = await swapperCtr.swapEtherToToken(
      CONTRACTS.DAI,
      BigInt("3100000000000000000000"),
      {
        value: ethers.parseEther("1"),
      }
    );

    await expect(tx)
      .to.emit(swapperCtr, "isSwapValidEvent")
      .withArgs(true, anyValue, anyValue);

    let txReceipt = await tx.wait();

    console.log("Gas used for tx:", txReceipt!.gasUsed);

    console.log(
      "DAI received for 1 ETH:",
      ethers.formatEther(await dai.balanceOf(signers[0].address))
    );

    // swap for USDC

    tx = await swapperCtr.swapEtherToToken(
      CONTRACTS.USDC,
      BigInt("3100000000"),
      {
        value: ethers.parseEther("1"),
      }
    );

    await expect(tx)
      .to.emit(swapperCtr, "isSwapValidEvent")
      .withArgs(true, anyValue, anyValue);

    txReceipt = await tx.wait();

    console.log("Gas used for tx:", txReceipt!.gasUsed);

    const usdc = await ethers.getContractAt("IERC20", CONTRACTS.USDC);

    console.log(
      "USDC received for 1 ETH:",
      ethers.formatUnits(await usdc.balanceOf(signers[0].address), 6)
    );
  });
});
