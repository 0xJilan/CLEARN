// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IClearn} from "../interfaces/IClearn.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IAggregatorPriceFeeds} from "../interfaces/IAggregatorPriceFeeds.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Treasury Contract
 * @author @0xJilan
 * @notice Treasury who :
 *  - Allow users to deposit ERC20 to CLEARN
 *  - Allow users to withdraw CLEARN to ERC20
 */
contract Treasury is Ownable, ReentrancyGuard, Pausable {
    IClearn public immutable clearn;
    address public strategyHub; ///@notice address who manage treasury funds
    uint256 public valueDeposited; ///@notice Actual value deposited in treasury

    event Deposit(address indexed _user, IERC20 indexed _token, uint256 _value);
    event Withdraw(
        address indexed _user,
        IERC20 indexed _token,
        uint256 _value
    );
    event DepositableToken(IERC20 indexed _token, address indexed _priceFreed);
    event TokenRemoved(IERC20 indexed _token);

    ///@notice depositableTokens list the whitelisted ERC20s that can be deposited
    mapping(IERC20 => bool) public depositableTokens;
    ///@notice priceFeeds link ERC20 token point to their aggregator price feed.
    mapping(IERC20 => IAggregatorPriceFeeds) public priceFeeds;

    ///@notice Treasury constructor init with CLEARN token
    ///@param _strategyHub The StrategyHub address that controls deposited funds
    ///@param _clearn CLEARN ERC20 address
    constructor(address _clearn, address _strategyHub) {
        clearn = IClearn(_clearn);
        strategyHub = _strategyHub;
    }

    /// @notice Check if token is allowed to be deposit in treasury;
    modifier depositable(IERC20 _token) {
        require(depositableTokens[_token] == true, "Token not depositable");
        _;
    }

    ///@notice return asset price and feed from Oracle.
    ///@param _token Token address of token data needed
    function getPrice(
        IERC20 _token
    ) public view returns (uint256, IAggregatorPriceFeeds) {
        IAggregatorPriceFeeds feed = priceFeeds[_token];
        (, int256 price, , , ) = feed.latestRoundData();
        return (uint256(price), feed);
    }

    ///@notice Add token to whitelisted assets and add its associated oracle
    ///@param _token address of the token
    ///@param _pricefeed address for the pricefeed
    function addTokenInfo(
        IERC20 _token,
        address _pricefeed
    ) external onlyOwner {
        priceFeeds[_token] = IAggregatorPriceFeeds(_pricefeed);
        depositableTokens[_token] = true;
        emit DepositableToken(_token, _pricefeed);
    }

    ///@notice Remove token to whitelisted assets and remove its associated oracle
    ///@param _token address of the token
    function removeTokenInfo(IERC20 _token) external onlyOwner {
        delete depositableTokens[_token];
        delete priceFeeds[_token];
        emit TokenRemoved(_token);
    }

    ///@notice Convert USDC to CLEARN 18 decimals format
    ///@param _amount amount in 6 decimals to convert
    function convertUSDCDecimals(
        uint256 _amount
    ) internal pure returns (uint256) {
        return _amount * 10 ** 12;
    }

    ///@notice Convert CLEARN to USDC 6 decimals format
    ///@param _amount amount in 18 decimals to convert
    function convertCLEARNDecimals(
        uint256 _amount
    ) internal pure returns (uint256) {
        return _amount / 10 ** 12;
    }

    ///@notice Deposit provide users a way to invest a depositable asset  in treasury,
    /// then treasury mint CLEARN by 1:1 ratio and give back equivalent CLEARN
    ///@param _token the token which is to be deposited
    ///@param _amount the amount for this particular deposit
    function deposit(
        IERC20Metadata _token,
        uint256 _amount
    ) external nonReentrant depositable(_token) whenNotPaused {
        uint256 balanceOf = IERC20(_token).balanceOf(msg.sender);
        require(_amount > 0, "Deposit must be more than 0");
        require(_amount <= balanceOf, "Not enough USDC");
        uint256 valueToMint = convertUSDCDecimals(_amount);
        uint256 allowance = IERC20(_token).allowance(msg.sender, address(this));
        require(allowance >= _amount, "Raise token allowance");
        valueDeposited += valueToMint;
        emit Deposit(msg.sender, _token, valueToMint);
        bool success = IERC20(_token).transferFrom(
            msg.sender,
            strategyHub,
            _amount
        );
        success
            ? clearn.creditTo(msg.sender, valueToMint)
            : revert("Transfert failed!");
    }

    ///@notice Withdraw provide users a way to get back his initial invest from treasury,
    /// for this treasury burn user CLEARN's by 1:1 ratio and give back equivalent USDC
    ///@param _token the token withdrawable (USDC)
    ///@param _amount the amount for this particular withdraw
    function withdraw(
        IERC20Metadata _token,
        uint256 _amount
    ) external nonReentrant whenNotPaused {
        require(_amount > 0, "Deposit must be more than 0");
        uint256 balanceOf = clearn.balanceOf(msg.sender);
        require(_amount <= balanceOf, "Not enough CLEARN");
        uint256 valueToWithdraw = convertCLEARNDecimals(_amount);

        uint256 allowance = IERC20(_token).allowance(
            strategyHub,
            address(this)
        );
        require(allowance >= valueToWithdraw, "Raise token allowance");
        valueDeposited -= _amount;
        emit Withdraw(msg.sender, _token, valueToWithdraw);
        bool success = IERC20(_token).transferFrom(
            strategyHub,
            msg.sender,
            valueToWithdraw
        );
        success
            ? clearn.debitFrom(msg.sender, _amount)
            : revert("Transfert failed!");
    }
}
