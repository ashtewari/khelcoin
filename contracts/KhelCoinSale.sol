// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./Crowdsale.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract KhelCoinSale is Crowdsale, Ownable, Pausable {

    event RateChanged(address indexed changedBy, uint256 newRate);

    // rate in TKNbits
    constructor (uint256 rate, address payable wallet, IERC20 token)     
        Crowdsale(rate, wallet, token){}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function updateRate(uint256 newRate) public onlyOwner {
        require(newRate > 0, "rate must be non-zero");
        _rate = newRate;

        emit RateChanged(_msgSender(), newRate);
    }  

    function _preValidatePurchase(address beneficiary, uint256 weiAmount)
        internal
        view
        whenNotPaused
        override
    {
        super._preValidatePurchase(beneficiary, weiAmount);
    }      
}