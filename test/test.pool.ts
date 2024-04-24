import { ethers } from "hardhat";
import { CONTRACTS_SEPOLIA } from "../scripts/helpers";

describe("Check pool is it returning anything on sepolia", function () {
  it("Pool testing if is alive on sepolia", async () => {
    console.log("Swap 0.0001 ETH to DAI");

    const network = await ethers.provider.getNetwork();

    if (network.name !== "sepolia") {
      throw new Error("Only sepolia network is supported for testing");
    }

    const signers = await ethers.getSigners();

    const caller = signers[0].address;

    const router = await ethers.getContractAt(
      "IV3SwapRouter",
      "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"
    );

    const input = {
      tokenIn: CONTRACTS_SEPOLIA.WETH,
      tokenOut: CONTRACTS_SEPOLIA.DAI,
      fee: 3000,
      recipient: caller,
      amountIn: ethers.parseEther("0.0001"),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    };

    const dai = await ethers.getContractAt("IERC20", CONTRACTS_SEPOLIA.DAI);

    const before = await dai.balanceOf(caller);
    const tx = await router.exactInputSingle(input, {
      value: ethers.parseEther("0.0001"),
    });

    await tx.wait();

    const after = await dai.balanceOf(caller);

    console.log("DAI received:", ethers.formatEther(after - before));
  });
});
