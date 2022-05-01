var KhelCoin = artifacts.require("./KhelCoin.sol");

contract('KhelCoin', async accounts => {
  
  it('initializes the contract with correct values', async () => {
    const instance = await KhelCoin.deployed();
    const name = await instance.name();
    assert.equal(name, 'KHEL Coin', 'token has correct name')
  });
});