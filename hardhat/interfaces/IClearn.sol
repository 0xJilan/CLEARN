// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Interface of CLEARN token

interface IClearn is IERC20 {
    function mint(address _to, uint256 amount_) external;

    function setMinter(address _minter) external onlyOwner;

    function debitFrom(
        address _from,
        uint256 _amount
    ) external virtual onlyMinter;

    function creditTo(
        address _toAddress,
        uint256 _amount
    ) external virtual onlyMinter;
}
