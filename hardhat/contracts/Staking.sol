// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

/// @title Clearn Staking
/// @author @0xJilan
/// @notice implementation inspired byERC4626 which serves as yield bearing vaults
contract Staking is ReentrancyGuard, Ownable, Pausable {
    IERC20 public rewardsToken;
    IERC20 public stakingToken;
    uint256 public lastUpdateTime; ///@notice timestamp of last time reward updated
    uint256 public rewardPerTokenStored;
    uint256 public periodFinish = 0; ///@notice timestamp of next period Finish
    uint256 public rewardRate = 0; ///@notice amount of token earn per second
    uint256 public rewardsDuration = 30 days; ///@notice 30 days in seconds  = 2592000
    address public yieldDistributor; ///@notice address who controls yield rewards
    uint256 private _totalSupply; ///@notice totalSupply

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) private _balances;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event YieldDistributorSet(
        address indexed caller,
        address indexed _yieldDistributor
    );

    constructor(address _stakingToken, address _rewardsToken) {
        rewardsToken = IERC20(_rewardsToken); ///@notice USDC address
        stakingToken = IERC20(_stakingToken); ///@notice CLEARN address
    }

    ///@notice modifier to update reward on trigger
    ///@param _account if valid address,  update reward earned for address
    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (_account != address(0)) {
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
        _;
    }

    ///@notice set contract Address who will be able to deposit rewards
    ///@param _yieldDistributor address who controls yield rewards
    function setYield(address _yieldDistributor) external onlyOwner {
        yieldDistributor = _yieldDistributor;
        emit YieldDistributorSet(msg.sender, _yieldDistributor);
    }

    ///@notice set contract state on pause
    function pause() external onlyOwner {
        _pause();
    }

    ///@notice set contract state on unpause
    function unpause() external onlyOwner {
        _unpause();
    }

    ///@notice Transfer reward to Staking contract and update reward rate
    ///@param _rewards amount of yield generated to deposit
    function issuanceRate(
        uint256 _rewards
    ) public nonReentrant updateReward(address(0)) {
        require(msg.sender != yieldDistributor, "Only Yield Distributor");
        require(_rewards > 0, "Zero rewards");
        require(_totalSupply != 0, "xCLEARN have 0 supply");
        if (block.timestamp >= periodFinish) {
            rewardRate = _rewards / rewardsDuration;
        } else {
            uint256 remainingSeconds = periodFinish - block.timestamp;
            uint256 remainingRewards = remainingSeconds * rewardRate;
            rewardRate = (_rewards + remainingRewards) / rewardsDuration;
        }
        IERC20(rewardsToken).transferFrom(msg.sender, address(this), _rewards);
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(_rewards);
    }

    ///@notice timestamp of last time reward applicable;
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    ///@notice amount of reward per xCLEARN
    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        uint256 remainingSeconds = lastTimeRewardApplicable() - lastUpdateTime;
        uint256 pendingRewardsPerToken = remainingSeconds * rewardRate * 1e18;
        return rewardPerTokenStored + (pendingRewardsPerToken / _totalSupply);
    }

    ///@notice Total amount earned by an address
    ///@param _account address to calcualte
    function earned(address _account) public view returns (uint256) {
        return
            ((_balances[_account] *
                (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18) +
            rewards[_account];
    }

    ///@notice reward rate for 1 month
    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * rewardsDuration;
    }

    ///@notice Stake provide users a way to stake his CLEARN token to earn yield,
    /// relative to his shares(xCLEARN)
    ///@param _amount CLEARN  amount to deposit
    function stake(
        uint256 _amount
    ) public nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 clearnBalance = stakingToken.balanceOf(msg.sender);
        require(_amount > 0, "Stake  must be more than 0");
        require(_amount <= clearnBalance, "Not enough CLEARN");
        uint256 allowance = stakingToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Raise token allowance");
        _totalSupply += _amount;
        _balances[msg.sender] += _amount;
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _amount);
    }

    ///@notice Withdraw provide users a way to unstake his CLEARN token,
    /// then, user don't have xCLEARN and stop to earn yield
    ///@param _amount CLEARN  amount to withdraw
    function withdraw(
        uint256 _amount
    ) public nonReentrant updateReward(msg.sender) {
        require(_amount > 0, "Withdraw must be more than 0");
        require(_amount <= _balances[msg.sender], "Not enough xCLEARN");
        _totalSupply -= _amount;
        _balances[msg.sender] -= _amount;
        stakingToken.transfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);
    }

    ///@notice Withdraw provide users a way to harvest his rewards without unstake,
    function getReward()
        public
        nonReentrant
        updateReward(msg.sender)
        returns (uint256)
    {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
        return reward;
    }

    ///@notice Exit provide users a way to withdraw his Clearn while harvesting his rewards,
    function exit() external {
        withdraw(_balances[msg.sender]);
        getReward();
    }

    ///@notice total xClearn supply,
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    ///@notice balance of xClearn,
    ///@param _account address balance
    function balanceOf(address _account) external view returns (uint256) {
        return _balances[_account];
    }
}
