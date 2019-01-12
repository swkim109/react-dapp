//컨트랙트
module.exports = function(callback) {

    web3.eth.getAccounts().then((accounts, error) => {
        web3.eth.sendTransaction({from:accounts[0], to: "0xe65edCe2b80A43cD52C2B8B6422BF5055D5fC09B", value:web3.utils.toWei("10", "ether")}, callback);
    });

}
