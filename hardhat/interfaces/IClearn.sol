// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Interface of CLEARN token
interface IClearn is IERC20 {
    function setMinter(address _minter) external;

    function debitFrom(address _from, uint256 _amount) external;

    function creditTo(address _toAddress, uint256 _amount) external;
}
