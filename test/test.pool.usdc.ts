import { ethers } from "hardhat";
import { CONTRACTS_SEPOLIA } from "../scripts/helpers";

describe("Check pool is it returning anything on sepolia", function () {
  it("Pool testing if is alive on sepolia", async () => {
    console.log("Swap 0.0001 ETH to USDC");

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
      tokenOut: CONTRACTS_SEPOLIA.USDC,
      fee: 500,
      recipient: caller,
      amountIn: ethers.parseEther("0.0001"),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    };

    const tokenOut = await ethers.getContractAt(
      "IERC20",
      CONTRACTS_SEPOLIA.USDC
    );

    const before = await tokenOut.balanceOf(caller);
    const tx = await router.exactInputSingle(input, {
      value: ethers.parseEther("0.0001"),
    });

    await tx.wait();

    const after = await tokenOut.balanceOf(caller);

    console.log("USDC received:", ethers.formatUnits(after - before, 6));
  });
});
