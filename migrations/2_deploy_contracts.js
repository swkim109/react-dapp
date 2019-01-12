var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var coinToFlip = artifacts.require("CoinToFlip");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(coinToFlip);
};
