import chai, { expect, assert } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { Presale, Staking, Token } from "../typechain-types";
import roundsRaw from "./rounds.json";
import bn from "bignumber.js";

chai.use(solidity)

const DECIMALS = new bn(10).pow(18);

const UNISWAP_ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const USDT_ADDRESS = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

const ethersToBN = (bignum: any) => {
    return new bn(bignum.toString());
}

describe("Test contracts", () => {

    let token: Token;
    let staking: Staking;
    let presale: Presale;

    beforeEach(async () => {
        const tokenFactory = await ethers.getContractFactory("Token");
        const stakingFactory = await ethers.getContractFactory("Staking");
        const presaleFactory = await ethers.getContractFactory("Presale");

        token = await tokenFactory.deploy("Royal", "ROYT");
        staking = await stakingFactory.deploy();
        presale = await presaleFactory.deploy();

        assert.isDefined(token);
        assert.isDefined(staking);
        assert.isDefined(presale);

        await (await presale.init(token.address, staking.address, UNISWAP_ROUTER_ADDRESS, "0xDEaDEfE26dfb449eE4E8bA90c12cF04A24009515")).wait();
        await (await token.init([presale.address, staking.address])).wait;
        await (await staking.init(presale.address, token.address, USDT_ADDRESS)).wait;
      
        const nowSeconds = Number((new Date().getTime() / 1000).toFixed(0));

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

    });

    it("Tests deposit and then checks staking", async () => {
        const [owner] = await ethers.getSigners();

        const balanceOf = await owner.getBalance();

        const roundInfo = await presale.getCurrentRoundInfo();
        const round = roundInfo[0];
        const tokensSold = ethersToBN(roundInfo[1]).div(DECIMALS);

        const buyAmount = new bn(1).times(DECIMALS).toFixed();
        const priceToPay = ethersToBN(round.price).toFixed();

        await (await presale.buy(buyAmount, { value: priceToPay })).wait();
        
        const deposits = await staking.getAllDeposits(owner.address);

        console.log(deposits);

        const roundsLength = await presale.roundsLength();
        const rounds = [];
        for(let i = 0; i < roundsLength.toNumber(); i++) {
            const round = await presale.rounds(i);

            rounds.push(round);
        }

        const nowSeconds = Number((new Date().getTime() / 1000).toFixed(0));
        
        console.log(nowSeconds + "\n");
        for(const round of rounds) {
            const startTime = round.startTime.toNumber();
            const duration = round.duration.toNumber();
            
            console.log(`${startTime+duration}`);
            console.log("LEFT HOURS:", (startTime + duration - nowSeconds)/(60*60));
            // const date = new Date(startTime+duration);
            // console.log(date);
        }
    });

});