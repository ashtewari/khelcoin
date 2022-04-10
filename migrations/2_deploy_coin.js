const KhelCoin = artifacts.require("./KhelCoin");

module.exports = function (deployer) {
  deployer.deploy(KhelCoin);
};
