var coinToFlip = artifacts.require("CoinToFlip");

module.exports = function(deployer) {
  deployer.deploy(coinToFlip);
};
