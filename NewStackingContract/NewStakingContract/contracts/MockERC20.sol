// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(
        uint256 supply
    ) ERC20("Binance USD", "BUSD") {
        _mint(msg.sender, supply);
    }

    function mintTokens(uint256 _amount) external {
        _mint(msg.sender, _amount);
    }
}