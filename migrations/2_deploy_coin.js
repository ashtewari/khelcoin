const KhelCoin = artifacts.require("./KhelCoin");
const KhelCoinSale = artifacts.require("./KhelCoinSale");

module.exports = async function (deployer) {
    let addr = await web3.eth.getAccounts();
    await deployer.deploy(KhelCoin);
    await deployer.deploy(KhelCoinSale, 1, addr[0], KhelCoin.address);      
};
