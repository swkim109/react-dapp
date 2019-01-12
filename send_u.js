//player
module.exports = function(callback) {

    web3.eth.getAccounts().then((accounts, error) => {
        web3.eth.sendTransaction({from:accounts[2], to: "0x547d73355A851079E0395aDB2C647821b74C7eAF", value:web3.utils.toWei("10", "ether")}, callback);
    });

}
