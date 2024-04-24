import { ethers } from "hardhat";
import { Swapper } from "../typechain-types";
import { CONTRACTS_SEPOLIA } from "../scripts/helpers";

describe("Swapper", function () {
  it("Swap on sepolia", async () => {
    console.log("0.0001 ETH to DAI on sepolia");

    const network = await ethers.provider.getNetwork();

    if (network.name !== "sepolia") {
      throw new Error("Only sepolia network is supported for testing");
    }

    const CONTRACTS = CONTRACTS_SEPOLIA;

    const SWAPPER = "0xBa2C7AB80B0A2E79aA04e9F29466409f5CEd1C1A";

    const signers = await ethers.getSigners();

    const caller = signers[0];
    const swapper = await ethers.getContractAt("Swapper", SWAPPER);

    const swapperCtr = swapper as unknown as Swapper;

    const dai = await ethers.getContractAt("IERC20", CONTRACTS.DAI);

    const before = await dai.balanceOf(caller.address);

    const tx = await swapperCtr.swapEtherToToken(CONTRACTS.DAI, 0, {
      value: ethers.parseEther("0.0001"),
    });

    await tx.wait();

    const after = await dai.balanceOf(caller.address);

    console.log("Dai received:", ethers.formatEther(after - before));
  });
});
