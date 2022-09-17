pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./interfaces/IMintableERC20.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/IUniswapRouterV2.sol";
import "./Initializable.sol";

contract Presale is Ownable, ReentrancyGuard, Initializable {

    event Mint (
        address indexed to,
        uint256 amount
    );

    struct PresaleRound {
        uint256 saleAmount;
        uint256 startTime;
        uint256 duration;
        uint256 price;
    }

    IMintableERC20 public token;
    IStaking public staking;
    IUniswapRouterV2 public uniswapRouter;

    uint256 public currentRoundId;

    mapping(uint256 => PresaleRound) public rounds;
    uint256 public roundsLength;

    constructor() {
    }

    function init(address _token, address _staking, address _router) external onlyOwner notInitialized {
        token = IMintableERC20(_token);
        staking = IStaking(_staking);
        uniswapRouter = IUniswapRouterV2(_router);

        initialized = true;
    }

    fallback() external {

    }

    error WrongEtherProvided();
    error AskedTooMuchTokensToMint();
    error ZeroTokensToBuy();

    function buy(uint256 _tokensToBuy) external payable nonReentrant {
        if(_tokensToBuy <= 0) {
            revert ZeroTokensToBuy();
        }

        uint256 _roundId = currentRoundId;
        PresaleRound memory round = rounds[_roundId];

        if(block.timestamp > round.startTime + round.duration && _roundId < roundsLength) {
            _roundId++;
            currentRoundId = _roundId;
            // rounds[_roundId + 1].startTime = block.timestamp;
            round = rounds[_roundId];
        }

        if(msg.value < (_tokensToBuy * round.price)) {
            revert WrongEtherProvided();
        }

        if(round.saleAmount < _tokensToBuy) {
            revert AskedTooMuchTokensToMint();
        }

        token.mint(address(this), _tokensToBuy);
        rounds[_roundId].saleAmount -= _tokensToBuy;
    
        staking.stakePresale(msg.sender, _tokensToBuy);

        emit Mint(
            msg.sender,
            _tokensToBuy
        );
    }
}