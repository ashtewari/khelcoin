// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./Crowdsale.sol";

contract KhelCoinSale is Crowdsale {

    // rate in TKNbits
    constructor (uint256 rate, address payable wallet, IERC20 token)     
        Crowdsale(rate, wallet, token){}
}