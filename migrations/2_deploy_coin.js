const KhelCoin = artifacts.require("./KhelCoin");

module.exports = async function (deployer) {
    web3.eth.transactionPollingTimeout = 5400;
    let accounts = await web3.eth.getAccounts();  
    await deployer.deploy(KhelCoin, {from: accounts[1], overwrite: false});   
};
