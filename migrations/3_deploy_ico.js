const KhelCoin = artifacts.require("./KhelCoin");
const KhelCoinSale = artifacts.require("./KhelCoinSale");

module.exports = async function (deployer) {
    web3.eth.transactionPollingTimeout = 5400;
    let accounts = await web3.eth.getAccounts();  
    await deployer.deploy(KhelCoinSale, 10000, accounts[1], KhelCoin.address, {from: accounts[1], overwrite: false});
};
