# Development environment

## Usage

### Pre Requisites

Before running any command, make sure to install dependencies from terminal inside working dir:

```sh
npm install
```

```sh
set .env file in root dir accordingly

ETH_MAINNET= <url to mainnet node>
ETH_SEPOLIA= <url to sepolia node>
DEPLOY_KEY= <account private key>  NOTE: be sure to have some ETH on this account on sepolia
```

### Test

Run the tests from project root dir with following commands:

```sh
npx hardhat test tests/test.local.ts
npx hardhat test tests/test.sepolia.ts --network sepolia

```

```sh
About tests:
npx hardhat test tests/test.local.ts -> executes against hardhat node forked mainnet
npx hardhat test tests/test.sepolia.ts -> executes against deployed contract on sepolia

```

## Notes

```
Tested on sepolia:
DAI - 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357
minOut == 0

This is too ensure transaction passes on swap as uniswap pools on sepolia are not very healthy

If minOut is not satisifed tx will revert on uniswap router

If minOut is set to 0, there is a validation of price against oracle, event is emitted depending if price is fair or not



```
