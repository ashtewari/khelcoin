App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,
  web3NotFound: false,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function() {
    web3NotFound = false;
    
    if(typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'){
      //getting Permission to access. This is for when the user has new MetaMask
      window.ethereum.enable();
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);
    
    }else if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      web3 = new Web3(window.web3.currentProvider);
      // Acccounts always exposed. This is those who have old version of MetaMask
    
    } else {
      web3NotFound = true;
      return App.render();
    }    
    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("KhelCoinSale.json", function(dappTokenSale) {
      App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
      App.contracts.DappTokenSale.setProvider(App.web3Provider);
      App.contracts.DappTokenSale.deployed().then(function(dappTokenSale) {
        console.log("KhelCoin Sale Address:", dappTokenSale.address);
      });
    }).done(function() {
      $.getJSON("KhelCoin.json", function(dappToken) {
        App.contracts.DappToken = TruffleContract(dappToken);
        App.contracts.DappToken.setProvider(App.web3Provider);
        App.contracts.DappToken.deployed().then(function(dappToken) {
          console.log("KhelCoin Address:", dappToken.address);
        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

  // Listen for events emitted from the contract
  // event TokensPurchased(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
  listenForEvents: function() {
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      instance.TokensPurchased({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');
    var panelPromptWeb3 = $('#panelPromptWeb3');

    loader.show();
    content.hide();
    panelPromptWeb3.hide();

    if(web3NotFound) 
    {
      loader.hide();
      panelPromptWeb3.show();
    }
    else
    {
      panelPromptWeb3.hide();

        // Load account data
        console.log("Loading accounts .."); 
        web3.eth.getCoinbase(function(err, account) {
          if(err === null) {
            App.account = account;
            $('#accountAddress').html("Your Account: " + account);
          }
          else {
            console.log(err);
          }
        })
        
        // Load token sale contract
        App.contracts.DappTokenSale.deployed().then(function(instance) {
          dappTokenSaleInstance = instance;      
          return dappTokenSaleInstance.rate();
        }).then(function(rate) {            
          App.tokenPrice = web3.fromWei(rate, 'wei');     
          $('.token-price').html(App.tokenPrice.toNumber());    
          // Load token contract
          App.contracts.DappToken.deployed().then(function(instance) {
            dappTokenInstance = instance;
            return dappTokenInstance.balanceOf(App.account);
          }).then(function(balance) {        
            $('.dapp-balance').html(web3.fromWei(balance, 'ether').toNumber());
            var numberOfTokens = $('#numberOfTokens').val();
            numberOfTokens = web3.toWei(numberOfTokens);    
            App.loading = false;
            loader.hide();
            content.show();
          })
        });
      }
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    numberOfTokens = web3.toWei(numberOfTokens);
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(App.account, {
        from: App.account,
        value: numberOfTokens / App.tokenPrice,
        gas: 500000 // Gas limit
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') // reset number of tokens in form
      // Wait for Sell event
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});
