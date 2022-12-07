// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IClearn} from "../interfaces/IClearn.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IAggregatorPriceFeeds} from "../interfaces/IAggregatorPriceFeeds.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Treasury Contract
 * @author @0xJilan
 * @notice Treasury who :
 *  - Allow users to deposit ERC20 to CLEARN
 *  - Allow users to withdraw CLEARN to ERC20
 */
contract Treasury is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    ///@notice 100 USD
    uint256 internal constant MIN_VALUE = 100 * 10 ** 18;
    IClearn public immutable clearn;
    ///@notice address who manage treasury funds
    address public strategyHub;
    uint256 public valueDeposited;

    event Deposit(
        address indexed _depositor,
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


    //TODO: COMMENT GET PRICE
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

        
     ///@dev Deposit provide users a way to invest a depositable asset  in treasury,
     /// then treasury mint CLEARN by 1:1 ratio and give back equivalent CLEARN
     ///@param _token the token which is to be deposited
     ///@param _amount the amount for this particular deposit
    function deposit(IERC20Metadata _token, uint256 _amount)
        external
        nonReentrant
        depositable(_token)
        whenNotPaused
    {
        require(_amount > 0, "Deposit must be more than 0");
        uint8 decimals = IERC20Metadata(_token).decimals();
        (uint256 tokenPrice, IAggregatorPriceFeeds tokenFeed) = getPrice(_token);
        uint256 value;
        if (decimals != 18) {
            value =
                (tokenPrice * _amount * 1e18) /
                10**(decimals + tokenFeed.decimals());
                console.log('value if token decimal != 18 :',value );
        } else {
            value = (tokenPrice * _amount) / 10**(tokenFeed.decimals());
            console.log('value if token decimal = 18 :',value );
        }
        require(value >= MIN_VALUE, "less than min deposit of $100");
        valueDeposited += value;
        emit Deposit(msg.sender, _token, value);
        IERC20(_token).safeTransferFrom(msg.sender, strategyHub, _amount);
        clearn.creditTo(msg.sender, value);
    }
}
