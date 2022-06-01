var KhelCoin = artifacts.require("./KhelCoin.sol");

contract('KhelCoin', async accounts => {
  
  var token;
  const toBN = web3.utils.toBN;
  

  beforeEach("before-each-test", async function() {
    token = await KhelCoin.deployed();
  });

  it('initializes the contract with correct values', async function() {    
    const name = await token.name();
    const symbol = await token.symbol();
    assert.equal(name, 'KHEL Coin', 'token has correct name');
    assert.equal(symbol, 'KHEL', 'token has correct symbol');
  });

  it('initial coin supply is correct upon deployment', async function() {
    const totalSupply = await token.totalSupply();
    const adminBalance = await token.balanceOf(accounts[0]);
    assert.equal(totalSupply.toString(), web3.utils.toWei('100000000'), 'total supply is set to 100M coins');
    assert.equal(adminBalance.toString(), web3.utils.toWei('50000000'), 'admin balance is set to 50M coins');
  });
 
  it('transfers token ownership', async function() {
    const recipient = accounts[5];
    const qtyToTransfer = 10;
    
    var balanceBeforeTransfer = await token.balanceOf(recipient);
    var balanceOfSenderBeforeTransfer = await token.balanceOf(accounts[0]);
    
    var receipt = await token.transfer(recipient, qtyToTransfer);

    var balanceAfterTransfer = await token.balanceOf(recipient);
    var balanceOfSenderAfterTransfer = await token.balanceOf(accounts[0]);

    assert.equal(balanceAfterTransfer.toString(), (balanceBeforeTransfer.addn(10)).toString(), "balance after transfer is not correct");
    assert.equal((balanceOfSenderAfterTransfer.addn(10)).toString(), balanceOfSenderBeforeTransfer.toString(), "balance of sender after transfer is not correct");
    assert.equal(receipt.logs.length, 1, 'must emit 1 event');
    assert.equal(receipt.logs[0].event, 'Transfer', 'must be a Transfer event');
    assert.equal(receipt.logs[0].args.value.toString(), '10', 'must Transfer event for 10 coins');    
  });

  it('approves tokens for delegated transfers', async function() {
    const spender = accounts[3];
    const qty = 10;

    var result = await token.approve.call(spender, qty);
    assert.equal(result, true, "approval call must return true");

    var receipt = await token.approve(spender, qty);
    assert.equal(receipt.logs.length, 1, 'must emit 1 event');
    assert.equal(receipt.logs[0].event, 'Approval', 'must be a Approval event');
    assert.equal(receipt.logs[0].args.value.toString(), '10', 'must Transfer event for 10 coins');        

    var approvedAllowance = await token.allowance(accounts[0], spender);
    assert.equal(approvedAllowance.toNumber(), 10, "approved allowance should match the approvals");
  });

  it('token transfers - enough allowance is available', async function() {
    
    var fromAccount = accounts[2];
    var toAccount = accounts[4];
    var spenderAccount = accounts[6];
    
    var fundReceipt = await token.transfer(fromAccount, 500, {from: accounts[0]});
    var receiptApproval = await token.approve(spenderAccount, 200, {from: fromAccount});
    
    await token.transferFrom(fromAccount, toAccount, 50, {from: spenderAccount});

    assert.equal((await token.balanceOf(fromAccount)).toNumber(), 450, "deducted from sending account");
    assert.equal((await token.balanceOf(toAccount)).toNumber(), 50, "added to receiving account");
    assert.equal((await token.allowance(fromAccount, spenderAccount)).toNumber(), 150, "added to receiving account");    
  });

  it('token transfers - insufficient allowance', async function() {
    
    var fromAccount = accounts[2];
    var toAccount = accounts[4];
    var spenderAccount = accounts[6];
    
    var fundReceipt = await token.transfer(fromAccount, 500);
    var receiptApproval = await token.approve(spenderAccount, 200, {from: fromAccount});

    try {
      await token.transferFrom.call(fromAccount, toAccount, 250, {from: spenderAccount});  
      assert.fail('tx should have failed');
    } catch (error) {
      assert.include(error.message, "revert", "tx should be reverted");
    }
    
  });  

  it('token transfers (call) - sufficient allowance - returns true', async function() {
    
    var fromAccount = accounts[2];
    var toAccount = accounts[4];
    var spenderAccount = accounts[6];
    
    var fundReceipt = await token.transfer(fromAccount, 500);
    var receiptApproval = await token.approve(spenderAccount, 200, {from: fromAccount});

    var result = await token.transferFrom.call(fromAccount, toAccount, 100, {from: spenderAccount});
    assert.equal(result, true, 'transferfrom should return true upon success');
    
  });  

  it('token transfers (execute) - sufficient allowance - returns true', async function() {
    
    var fromAccount = accounts[2];
    var toAccount = accounts[4];
    var spenderAccount = accounts[6];
    
    var fundReceipt = await token.transfer(fromAccount, 500);
    console.log("fundReceipt: ", fundReceipt);

    var receiptApproval = await token.approve(spenderAccount, 200, {from: fromAccount});

    var result = await token.transferFrom.call(fromAccount, toAccount, 100, {from: spenderAccount});
    console.log(result);
    assert.equal(result, true, 'transferfrom should return true upon success');
    
  });  

  it('pause token transfers', async function() {
    
    var recipient = accounts[4];
    await token.pause();
    
    try {
      await token.transfer(recipient, 500);    
      assert.fail('tx should have failed');
    } catch (error) {
      assert.include(error.message, "revert Pausable: paused", "tx should be reverted, contract is paused.");
    }   
    
    await token.unpause();
    var result  = await token.transfer.call(recipient, 500);
    assert.equal(result, true, 'transfer should go through when unpaused');

  });  


});