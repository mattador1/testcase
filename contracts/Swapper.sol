// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

interface ERC20Swapper {
    /// @dev swaps the `msg.value` Ether to at least `minAmount` of tokens in `address`, or reverts
    /// @param token The address of ERC-20 token to swap
    /// @param minAmount The minimum amount of tokens transferred to msg.sender
    /// @return The actual amount of transferred tokens
    function swapEtherToToken(
        address token,
        uint minAmount
    ) external payable returns (uint);
}

interface IERC20Expanded is IERC20 {
    function decimals() external view returns (uint8);
}

interface IAaveOracle {
    function getAssetPrice(address asset) external view returns (uint256);
}

contract Swapper is UUPSUpgradeable, OwnableUpgradeable, ERC20Swapper {
    uint256 internal constant SLIPPAGE_BPS = 30; // 0.3%

    uint256 internal constant BASIS_POINTS_DIVISOR = 1e4;

    uint256 internal constant PRICE_PRECISION = 1e8;

    address internal WETH;

    address internal WETH_FEED;

    IAaveOracle internal AAVE_ORACLE;

    IUniswapV3Factory internal UNISWAP_FACTORY;

    IV3SwapRouter internal SWAP_ROUTER;

    event isSwapValidEvent(bool, uint256, uint256);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address weth_,
        address wethFeed_,
        address aaveOracle_,
        address uniswapFactory_,
        address router_
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        WETH = weth_;
        WETH_FEED = wethFeed_;
        AAVE_ORACLE = IAaveOracle(aaveOracle_);
        UNISWAP_FACTORY = IUniswapV3Factory(uniswapFactory_);
        SWAP_ROUTER = IV3SwapRouter(router_);
    }

    function swapEtherToToken(
        address token,
        uint minAmount
    ) external payable virtual returns (uint) {
        require(msg.value > 0, "Swapper: value to swap must be greater than 0");

        // assume we target only pools with 0.05%, 0.1% 0.3%, 1% fee
        uint24[4] memory fees = [
            uint24(500),
            uint24(1000),
            uint24(3000),
            uint24(10000)
        ];

        uint24 validFee;
        for (uint256 i; i < fees.length; ) {
            address pool = UNISWAP_FACTORY.getPool(WETH, token, fees[i]);

            if (pool != address(0)) {
                validFee = fees[i];
                break;
            }
            unchecked {
                i++;
            }
        }

        require(validFee > 0, "Swapper: no valid pool found for swap");

        // NOTE: sepolia doesn't really have healthy pools to validate against oracle
        IV3SwapRouter.ExactInputSingleParams memory swapInput = IV3SwapRouter
            .ExactInputSingleParams(
                WETH,
                token,
                validFee,
                msg.sender,
                msg.value,
                minAmount, // provided by the caller (usually through oracle) to ensure fair price (all or nothing swap)
                0 // we can leave this 0, it is a price limiter for partial swaps, we are controlling fair price with minAmount
            );

        uint256 amountOut = SWAP_ROUTER.exactInputSingle{value: msg.value}(
            swapInput
        );

        // we will not revert but just emit if price in unfair
        if (isValidPrice(token, msg.value, amountOut)) {
            emit isSwapValidEvent(true, msg.value, amountOut);
        } else {
            emit isSwapValidEvent(false, msg.value, amountOut);
        }

        return amountOut;
    }

    function isValidPrice(
        address outputToken,
        uint256 inputETH,
        uint256 outputTokenAmnt
    ) internal view returns (bool) {
        (, int256 priceWeth, , , ) = AggregatorV3Interface(WETH_FEED)
            .latestRoundData();

        uint256 priceToken = AAVE_ORACLE.getAssetPrice(outputToken);

        require(
            priceWeth > 0 && priceToken > 0,
            "Swapper: invalid price feeds"
        );

        uint256 exchangeRate = (uint256(priceWeth) * PRICE_PRECISION) /
            priceToken;

        uint256 estimatedToken = (inputETH * exchangeRate) / PRICE_PRECISION;

        // adjust for decimals
        estimatedToken =
            (estimatedToken * 10 ** IERC20Expanded(outputToken).decimals()) /
            (10 ** IERC20Expanded(WETH).decimals());

        // get absolute difference
        uint256 diffBps = (outputTokenAmnt * BASIS_POINTS_DIVISOR) /
            estimatedToken;

        uint256 absDiffBps = diffBps > BASIS_POINTS_DIVISOR
            ? diffBps - BASIS_POINTS_DIVISOR
            : BASIS_POINTS_DIVISOR - diffBps;

        // higher then SLIPPAGE_BPS from oracle estimate is not acceptable
        if (absDiffBps > SLIPPAGE_BPS) {
            return false;
        }
        return true;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyOwner {}
}
