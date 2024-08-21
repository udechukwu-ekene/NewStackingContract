// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract CactusStaking is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IERC20 public CACTT;

    uint256 public constant MIN_STAKING_AMOUNT = 200e18;
    uint256 public constant MAX_STAKING_AMOUNT = 1000000e18;
    uint256 public constant STAKING_APR = 30000; // 30% APY
    uint256 public constant STAKING_DURATION = 365 days;

    uint256 public totalStaked;
    uint256 public totalPayouts;

    mapping(address => Staking) public stakings;

    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event Harvested(address indexed account, uint256 amount);

    constructor(address _cactt) payable {
        CACTT = IERC20(_cactt);
    }

    struct Staking {
        uint256 rewardDebt;
        uint256 totalInvestments;
        uint256 currentInvestment;
        uint256 totalWithdrawal;
        uint256 initialTime;
        uint256 lastWithdrawn;
        uint256 earningStartTime;
        uint256 lockEndTime;
    }

      function getUserDetails(
        address _account
    ) external view returns (Staking memory, uint256) {
        uint256 reward = getRewards(_account);
        Staking memory staking = stakings[_account];
        return (staking, reward);
    }

    function stake(uint256 _amount) external {
        require(
            _amount >= MIN_STAKING_AMOUNT,
            "Amount is less than the minimum staking amount"
        );
        require(
            _amount <= MAX_STAKING_AMOUNT,
            "Amount is greater than the maximum staking amount"
        );
        require(
            CACTT.balanceOf(msg.sender) >= _amount,
            "Insufficient balance to participate"
        );

        uint256 allowance = CACTT.allowance(msg.sender, address(this));
        require(allowance >= _amount, "CACTT allowance is not enough");
        require(
            CACTT.transferFrom(msg.sender, address(this), _amount),
            "Failed to transfer CACTT"
        );

        updateUserStake(msg.sender);

        uint256 currentTime = block.timestamp;

        Staking storage staking = stakings[msg.sender];
        staking.currentInvestment += _amount;
        staking.initialTime = currentTime;
        staking.earningStartTime = currentTime;
        staking.lockEndTime = currentTime + STAKING_DURATION;
        staking.totalInvestments = staking.totalInvestments + _amount;

        totalStaked += _amount;

        emit Staked(msg.sender, _amount);
    }

    function updateUserStake(address account) internal {
        Staking storage staking = stakings[account];

        uint256 rewardAmount = getRewards(account);
        staking.rewardDebt = rewardAmount;
        staking.initialTime = block.timestamp;
        staking.lockEndTime = staking.initialTime + STAKING_DURATION;
    }

    function getRewards(address account) public view returns (uint256) {
        Staking storage staking = stakings[account];

        if (staking.currentInvestment == 0) {
            return staking.rewardDebt;
        }

        uint256 timeDiff = block.timestamp - staking.earningStartTime;
        uint256 earningRate = staking.currentInvestment * STAKING_APR;
        uint256 timeElapsed = Math.min(timeDiff, STAKING_DURATION);
        uint256 rewardAmount = (earningRate * timeElapsed) / (10000 * STAKING_DURATION);

        return staking.rewardDebt + rewardAmount;
    }

    function harvest() external nonReentrant {
        Staking storage staking = stakings[msg.sender];

        uint256 rewardAmount = getRewards(msg.sender);
        require(rewardAmount > 0, "harvest: not enough funds");

        staking.rewardDebt = 0;
        staking.totalWithdrawal = staking.totalWithdrawal + rewardAmount;
        staking.earningStartTime = block.timestamp;
        staking.lastWithdrawn = block.timestamp;

        totalPayouts += rewardAmount;

        CACTT.transfer(msg.sender, rewardAmount);
        emit Harvested(msg.sender, rewardAmount);
    }
    
    function unstake() external nonReentrant {
        Staking storage staking = stakings[msg.sender];

        uint256 totalBalance = getRewards(msg.sender) + staking.currentInvestment;
        require(totalBalance > 0, "Unstake: nothing to unstake");

        require(CACTT.balanceOf(address(this)) >= totalBalance,
            "Insufficient fund to initiate unstake"
        );

        updateUserStake(msg.sender);

        staking.currentInvestment = 0;
        staking.rewardDebt = 0;
        staking.totalWithdrawal = staking.totalWithdrawal + totalBalance;
        staking.earningStartTime = 0;
        staking.lastWithdrawn = block.timestamp;

        totalPayouts += totalBalance;

        CACTT.transfer(msg.sender, totalBalance);
        emit Unstaked(msg.sender, totalBalance);
    }
}
