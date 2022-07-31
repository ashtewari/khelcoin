const Migrations = artifacts.require("Migrations");

module.exports = async function (deployer) {
  web3.eth.transactionPollingTimeout = 5400;
  let accounts = await web3.eth.getAccounts();
  deployer.deploy(Migrations, {from: accounts[1], overwrite: false});
};
