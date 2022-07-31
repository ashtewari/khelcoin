const KhelCoin = artifacts.require("./KhelCoin");
const KhelCoinSale = artifacts.require("./KhelCoinSale");

module.exports = async function (deployer) {
    let accounts = await web3.eth.getAccounts();
    
    let khel = await KhelCoin.deployed();
    let ico = await KhelCoinSale.deployed();

    khel.transfer(ico.address, web3.utils.toWei('10000000'), {from: accounts[1]});
};
