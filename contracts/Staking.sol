pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "./Initializable.sol";

contract Staking is Ownable, ReentrancyGuard, Initializable {
    using Math for uint256;

    event Deposited(
        address indexed sender,
        address indexed owner,
        uint256 amount
    );

    event RewardReceived(
        address indexed owner,
        uint256 rewardAmount
    );

    struct Deposit {
        address to;
        bool locked;
        uint256 startTime;
        uint256 deposited;
        uint256 rewardTaken;
        uint256 percentage;
    }

    error NotPresale();
    modifier onlyPresale() {
        if(msg.sender != presale) {
            revert NotPresale(); 
        }
        _;
    }

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant START_PERCENTAGE = 500;
    uint256 public constant MAX_STAKING_TIME_IN_MONTHS = 12;
    bool public publicStakeStarted = false;
    uint256 public publicStakeStartTime;

    address public presale;
    IERC20 public token;

    mapping(address => mapping(uint256 => Deposit)) public userInfos;
    mapping(address => uint256) public userInfosLength;

    constructor() {

    }

    function init(address _presale, address _token) external onlyOwner {
        presale = _presale;
        token = IERC20(_token);
    }

    function stakePresale(address _to, uint256 _amount) external onlyPresale {
        uint256 nextDepositId = userInfosLength[_to];
        Deposit memory freshDeposit = Deposit(
            _to,
            true,
            block.timestamp,
            _amount,
            0,
            800 // in basis_points
        );

        userInfos[_to][nextDepositId] = freshDeposit;
        
        emit Deposited(
            msg.sender,
            _to,
            _amount
        );
    }

    error PublicStakeNotStarted();
    function stake(uint256 _amount) external {
        if(!publicStakeStarted) {
            revert PublicStakeNotStarted();
        }
    }

    function receiveReward() external nonReentrant {
        uint256 rewardAmount = 0;

        uint256 userDepositsLength = userInfosLength[msg.sender];

        for(uint256 i = 0; i < userDepositsLength; i++) {
            Deposit memory deposit = userInfos[msg.sender][i];
            uint256 monthsSinceStart = Math.min((block.timestamp - deposit.startTime) / (2678400), MAX_STAKING_TIME_IN_MONTHS);
            uint256 availableReward = (deposit.deposited * deposit.percentage * monthsSinceStart) / BASIS_POINTS;
            userInfos[msg.sender][i].rewardTaken += availableReward;

            rewardAmount += availableReward;
        }

        token.transfer(msg.sender, rewardAmount);

        emit RewardReceived(
            msg.sender,
            rewardAmount
        );
    }

    function activatePublicSale() external onlyOwner {
        publicStakeStartTime = block.timestamp;
        publicStakeStarted = true;
    }

    function getAvailableRewards(address _to) public view returns(uint256[] memory) {
        uint256 userRewardsLength = userInfosLength[_to];

        uint256[] memory result = new uint256[](userRewardsLength);

        for(uint256 i = 0; i < userRewardsLength; i++) {
            Deposit memory deposit = userInfos[_to][i];
            uint256 monthsSinceStart = (block.timestamp - deposit.startTime) / (2678400);


            result[i] = (deposit.deposited * deposit.percentage * monthsSinceStart) / BASIS_POINTS;
        }

        return result;
    }

    function getCurrentBasisPoints() internal returns(uint256) {
        uint256 monthsSinceStart = (block.timestamp - publicStakeStartTime) / (2678400);

        return 0;
    }
}