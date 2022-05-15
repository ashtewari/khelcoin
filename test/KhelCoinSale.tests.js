var KhelCoinSale = artifacts.require('./KhelCoinSale.sol');
var KhelCoin = artifacts.require('./KhelCoin.sol');

contract("KhelCoinSale", async accounts => {

    describe.only("ICO tests", async function() {
        
        var sale;
        var token;

        beforeEach("before-each-test-sale", async function() {
            sale = await KhelCoinSale.deployed();
            token = await KhelCoin.deployed();
        });

        it("should deploy with correct initial values", async function() {
            var conversionRate = await sale.rate();
            var weiRaised = await sale.weiRaised();            
            var tokenForSale = await sale.token();
            var wallet = await sale.wallet();

            assert.equal(conversionRate, 10000, "conversion rate is correct");
            assert.equal(weiRaised, 0, "wei raised is correct");
            assert.equal(tokenForSale, token.address, "sale token is correct");
            assert.equal(wallet, accounts[0], "wallet is correct");
        });

        it("execute buyToken without sending ether - should throw exception", async function() {
            try {
                await sale.buyTokens(accounts[1]);   
                assert.fail("expected to throw exception if trying to buy without sending ether") ;
            } catch (error) {
                assert.include(error.message, "revert Crowdsale: weiAmount is 0")
            }            
        });

        it.only("ownership transfer should update current allowances", async function() {
            var currentAllowance = await token.allowance(sale.address, accounts[0]);            
            console.log("currentAllowanceBefore = ", web3.utils.fromWei(currentAllowance.toString()))            
            assert.ok(currentAllowance > 0, "current allowance is set to max");

            console.log("owner (before)", await sale.owner());

            await sale.transferOwnership(accounts[8]);

            var currentAllowanceAfter = await token.allowance(sale.address, accounts[0]);   
            console.log("currentAllowanceAfter = ", web3.utils.fromWei(currentAllowanceAfter.toString()))            
            
            var newOwnerAllowance = await token.allowance(sale.address, accounts[8]);   
            console.log("newOwnerAllowance = ", web3.utils.fromWei(newOwnerAllowance.toString()))                        
            
            console.log("owner (after)", await sale.owner());
        });

        it("execute buyToken with ether - should succeed", async function() {
            
            var beneficairy = accounts[1];
            var conversionRate = await sale.rate();
            var wallet = await sale.wallet();

            var balanceBefore = (await web3.eth.getBalance(wallet)).toString();
            var balanceOfICOBefore = await token.balanceOf(sale.address);
            var balanceOfSenderBefore = await token.balanceOf(accounts[2]);
            var balanceOfBeneficiaryBefore = await token.balanceOf(beneficairy);
            
            // send tx from a different account, other than the forwarding account
            // this is to make it easier to check the amount received at the end
            await sale.buyTokens(beneficairy, {from: accounts[2], value: web3.utils.toWei('1')});              
            
            var balanceOfSenderAfter = await token.balanceOf(accounts[2]);
            var balanceOfBeneficiaryAfter = await token.balanceOf(beneficairy);
            var balanceOfICOAfter = await token.balanceOf(sale.address);
            var balanceAfter = (await web3.eth.getBalance(wallet)).toString();

            // sender of buyTokens tx does not loose or gain any tokens, it is paying for the tokens and the gas
            assert.equal(balanceOfSenderBefore.toString(), web3.utils.toWei("0"), "sender of tx has 0 tokens before purchase");
            assert.equal(balanceOfSenderAfter.toString(), web3.utils.toWei("0"), "sender of tx has 0 tokens after purchase");

            // beneficairy should have 10000 tokens after purchase
            assert.equal(balanceOfBeneficiaryBefore.toString(), web3.utils.toWei("0"), "beneficairy has 0 tokens before purchase");
            assert.equal(balanceOfBeneficiaryAfter.toString(), web3.utils.toWei(conversionRate.toString()), "beneficairy has correct number of tokens based on conversion rate");
            assert.equal(balanceOfBeneficiaryAfter.toString(), web3.utils.toWei("10000"), "beneficairy has 10000 tokens");

            // forwarding address should have received ether
            var weiRaised = await sale.weiRaised(); 
            assert.equal(weiRaised, web3.utils.toWei('1'), "wei raised is correct");                
            assert.equal(balanceAfter - balanceBefore, web3.utils.toWei('1'), "ether received");

            // ICO contract token balance is updated after sale
            assert.equal(web3.utils.fromWei(balanceOfICOBefore.toString()), "5000000", "tokens sold from ICO contract - before");
            assert.equal(web3.utils.fromWei(balanceOfICOAfter.toString()), "4990000", "tokens sold from ICO contract - after");

            // Transfer unsold tokens to the owner
            await token.transferFrom(sale.address, accounts[6], balanceOfICOAfter, {from: accounts[9]});
            var balanceOfICOAfter = await token.balanceOf(sale.address);
            console.log("balanceOfICOAfter = ", web3.utils.fromWei(balanceOfICOAfter.toString()));
            assert.equal(web3.utils.fromWei(balanceOfICOAfter.toString()), "0", "unsold tokens are transferred to the owner");
        });         
        
        it("not owner, should not change rate", async function() {            
            try {
                await sale.updateRate(12000, {from: accounts[5]});
                assert.fail("rate change attempted by non-owner, expected revert")    
            } catch (error) {
                assert.include(error.message, "revert Ownable: caller is not the owner")
            }
        });

        it("only owner, should change rate", async function() {
            var receipt = await sale.updateRate(12000, {from: accounts[0]});
            var newRate = await sale.rate();
            assert.equal(newRate, 12000, 'rate has been updated');
            
            assert.equal(receipt.logs.length, 1, 'must emit 1 event');
            assert.equal(receipt.logs[0].event, 'RateChanged', 'must be a RateChanged event');
            assert.equal(receipt.logs[0].args.newRate.toString(), '12000', 'new rate should be logged in the event');    
            assert.equal(receipt.logs[0].args.changedBy, accounts[0], 'rate changed by address should be logged in the event');    
        });  
        
        it("paused, should not allow sale", async function() {                        
            await sale.pause();

            try {                
                await sale.buyTokens(accounts[1], {from: accounts[2], value: web3.utils.toWei('1')});              
                assert.fail('tx should have failed');
            } catch (error) {
                assert.include(error.message, "revert Pausable: paused", "tx should be reverted, contract is paused.");
            }

            await sale.unpause();
            var receipt  = await sale.buyTokens(accounts[1], {from: accounts[2], value: web3.utils.toWei('1')});              
            assert.equal(receipt.logs.length, 1, 'must emit 1 event');
            assert.equal(receipt.logs[0].event, 'TokensPurchased', 'must be a TokensPurchased event');
        });        
    });

}); 