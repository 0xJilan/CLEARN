// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Clearn Token
/// @author @0xJilan
/// @notice ERC20 implementation which serves as proof of deposit in the treasury

contract Clearn is ERC20, Ownable {
    error NotOwner();
    error MinterSet();
    //TODO: Add Function documentation
    //TODO: Add Events for setMinter,  debitFrom, creditTo

    /// @notice Only treasury address can mint tokens
    address public minter;

    constructor() ERC20("Clearn", "CLEARN") {}

    modifier onlyMinter() {
        require(msg.sender == minter, "Not minter");
        _;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function debitFrom(
        address _from,
        uint256 _amount
    ) external virtual onlyMinter {
        _burn(_from, _amount);
    }

    function creditTo(
        address _toAddress,
        uint256 _amount
    ) external virtual onlyMinter {
        _mint(_toAddress, _amount);
    }
}
