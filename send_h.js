//house
module.exports = function(callback) {

    web3.eth.getAccounts().then((accounts, error) => {
        web3.eth.sendTransaction({from:accounts[0],
                                    to: "0xEf0F089f0D03fF4CC1a3188068D190109126379F",
                                 value:web3.utils.toWei("10", "ether")}, callback);
    });

}
