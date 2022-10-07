import { ethers } from "hardhat";
import bn from "bignumber.js";
import roundsRaw from "./rounds/rounds.json";

const DECIMALS = new bn(10).pow(18);

const UNISWAP_ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const USDT_ADDRESS = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"

async function main() {
  const tokenFactory = await ethers.getContractFactory("Token");
  const presaleFactory = await ethers.getContractFactory("Presale");
  const stakingFactory = await ethers.getContractFactory("Staking");

  const token = await tokenFactory.deploy("Royal", "ROYAL");
  const presale = await presaleFactory.deploy();
  const staking = await stakingFactory.deploy();

  const nowSeconds = Number((new Date().getTime() / 1000).toFixed(0));

  await (await presale.init(token.address, staking.address, UNISWAP_ROUTER_ADDRESS, "0xDEaDEfE26dfb449eE4E8bA90c12cF04A24009515")).wait();
  await (await token.init([presale.address, staking.address])).wait;
  await (await staking.init(presale.address, token.address, USDT_ADDRESS)).wait;

  const roundsPresale = roundsRaw.map((round, i) => {
    const timeSinceFirstRound = roundsRaw.slice(0, i).reduce((prev, next) => prev + next.duration, 0);

    return {
      saleAmount: new bn(round.mintAmount).times(DECIMALS).toFixed(),
      startTime: nowSeconds + timeSinceFirstRound,
      duration: round.duration,
      price: new bn(round.price).times(DECIMALS).toFixed(),
      minBuyPrice: 0
      // minBuyPrice: new bn(round.minBuyPrice).times(DECIMALS).toFixed() // TODO(NIKITA): uncomment after tests
    }
  });

  await (await presale.startPresale(roundsPresale)).wait();

  console.log("TOKEN:", token.address);
  console.log("PRESALE:", presale.address);
  console.log("STAKING:", staking.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
