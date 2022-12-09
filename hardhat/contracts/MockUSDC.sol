// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Mock USDC Token
/// @notice ERC20 implementation which serves as ERC20 USDC for running test locally
contract MockUSDC is ERC20, Ownable {
    uint8 private decimals_;

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        decimals_ = 6;
        _mint(msg.sender, 100000000000);
    }

    function decimals() public view override(ERC20) returns (uint8) {
        return decimals_;
    }

    function updateDecimals(uint8 _decimals) external {
        decimals_ = _decimals;
    }

    function mint(address _user, uint256 _amount) public {
        _mint(_user, _amount);
    }

    function burn(address _user, uint256 _amount) public {
        _burn(_user, _amount);
    }
}
