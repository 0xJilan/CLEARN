// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Clearn Token
/// @author @0xJilan
/// @notice ERC20 implementation which serves as proof of deposit in the treasury
contract Clearn is ERC20, Ownable {
    /// @notice Only treasury address can mint tokens
    address public minter;

    event SetMinter(address _minter);
    event Mint(address _toAddress, uint256 _amount);
    event Burn(address _from, uint256 _amount);

    constructor() ERC20("Clearn", "CLEARN") {}

    /// @notice Check if sender is Minter;
    modifier onlyMinter() {
        require(msg.sender == minter, "Not minter");
        _;
    }

    /// @notice Set minter address if called by Owner;
    /// @param _minter treasury address that will controls mint and burn;   
    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
        emit SetMinter(_minter);
    }

    /// @notice Mint CLEARN for an address if called by Minter;
    /// @param _toAddress address to be credited by mint;
    /// @param _amount amount of CLEARN to mint;

    function creditTo(
        address _toAddress,
        uint256 _amount
    ) external virtual onlyMinter {
        _mint(_toAddress, _amount);
        emit Mint(_toAddress, _amount);
    }

    /// @notice Burn CLEARN of a particular address if called by Minter;
    /// @param _from address to be debited by burn;
    /// @param _amount amount of CLEARN to burn;
    function debitFrom(
        address _from,
        uint256 _amount
    ) external virtual onlyMinter {
        _burn(_from, _amount);
        emit Burn(_from, _amount);
    }
}
