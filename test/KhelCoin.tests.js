var KhelCoin = artifacts.require("./KhelCoin.sol");

contract('KhelCoin', function(accounts) {
  var tokenInstance;

  it('initializes the contract with the correct values', function() {
    return KhelCoin.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.name();
    }).then(function(name) {
      assert.equal(name, 'KHEL Coin', 'has the correct name');
      return tokenInstance.symbol();
    }).then(function(symbol) {
      assert.equal(symbol, 'KHEL', 'has the correct symbol');
    });
  })
});