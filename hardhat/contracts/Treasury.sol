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

    uint256 public constant SCALE = 10 ** 18;
    uint256 internal constant MIN_VALUE = 50 * 10 ** 18;
    IClearn public immutable clearn;
    address public strategyHub;
    uint256 public valueDeposited;

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
        strategyHub = _strategyHub;
        clearn = IClearn(_clearn);
    }

    /// @notice Check if token is allowed to be deposit in treasury;
    modifier depositable(IERC20 _token) {
        require(depositableTokens[_token] == true, "Token not depositable");
        _;
    }

    function getPrice(
        IERC20 _token
    ) public view returns (uint256, IAggregatorPriceFeeds) {
        IAggregatorPriceFeeds feed = priceFeeds[_token];
        (, int256 price, , uint256 updatedAt, ) = feed.latestRoundData();
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
}
