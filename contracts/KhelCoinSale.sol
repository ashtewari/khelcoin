// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./Crowdsale.sol";

contract KhelCoinSale is Crowdsale, Ownable {

    event RateChanged(address indexed changedBy, uint256 newRate);

    // rate in TKNbits
    constructor (uint256 rate, address payable wallet, IERC20 token)     
        Crowdsale(rate, wallet, token){}

    function updateRate(uint256 newRate) public onlyOwner {
        require(newRate > 0, "rate must be non-zero");
        _rate = newRate;

        emit RateChanged(_msgSender(), newRate);
    }    
}