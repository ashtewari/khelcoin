App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,
  web3NotFound: false,
  selectedNetworkId: 0,

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
      App.selectedNetworkId = window.ethereum.networkVersion;
      console.log("selectedNetworkId = ", App.selectedNetworkId);

      // detect Metamask account change
      window.ethereum.on('accountsChanged', function (accounts) {
        console.log('accountsChanges',accounts);
        return App.initContracts();
      });

      // detect Network account change
      window.ethereum.on('networkChanged', function(networkId){
        console.log('networkChanged > ',networkId);
        App.selectedNetworkId = networkId; 
        return App.initContracts();   
      });      
    
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
      }).catch(function(err) {
        console.log(err);
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
        fromBlock: 'latest',
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      console.log("App.loading = ", App.loading);
      return;
    }
    console.log("App.loading = ", App.loading);
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');
    var panelPromptWeb3 = $('#panelPromptWeb3');

    loader.show();
    content.hide();
    panelPromptWeb3.hide();

    console.log("selectedNetworkId = ", App.selectedNetworkId);
    $('#selectedNetwork').html("Network: " + App.selectedNetworkId);    
    $('#contractDeployed').html("");  
    
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
            loader.show();
            content.hide();
            panelPromptWeb3.hide();            
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
            console.log("App.loading = ", App.loading);
            loader.hide();
            content.show();
          })
        }).catch(function(err) {          
          if(err.message.includes('has not been deployed to detected network'))
          {
            App.loading = false;
            console.log(err); 
            loader.show();
            content.hide();
            panelPromptWeb3.hide();
            // $("#myModal").modal()           
          }
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
  },

  connectWallet: function() {
    return App.initWeb3();
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});
