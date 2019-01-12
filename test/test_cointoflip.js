
const coinToFlip = artifacts.require("CoinToFlip");


contract("CoinToFlip", function(accounts) {


    //컨트랙트 배포자가 아니면 kill() 메소드가 실행되어서는 안된다.
    it("self-destruct should be executed by ONLY owner",  async () => {
        let instance = await coinToFlip.deployed();

        try {
            await instance.kill({from:accounts[9]}); //error가 정상
        } catch (e) {
            var err = e;
        }
        assert.isOk(err instanceof Error, "Anyone can kill the contract!");

    });



    //컨트랙트에 5 ETH를 전송하면 컨트랙트의 잔액은 5 ETH가 되어야 한다.
    it("should have initial fund", async () => {
        let instance = await coinToFlip.deployed();
        let tx = await instance.sendTransaction({from: accounts[9], value: web3.utils.toWei("5", "ether")});
        //console.log(tx);
        //console.log(await instance.checkHouseFund.call());
        let bal = await web3.eth.getBalance(instance.address);
        //console.log(bal);
        assert.equal(web3.utils.fromWei(bal, "ether").toString(), "5", "House does not have enough fund");

    });


    //0.1 ETH를 베팅하면 컨트랙트의 잔액은 (     ) ETH가 되어야 한다.
    it("should have normal bet", async () => {
        let instance = await coinToFlip.deployed();

        const val = 0.1;
        const mask = 1; //Tails 0000 0001

        await instance.placeBet(mask, {from:accounts[3], value:web3.utils.toWei(val.toString(), "ether")});
        let bal = await web3.eth.getBalance(instance.address);
        assert.equal(await web3.utils.fromWei(bal, "ether").toString(), "5.1", "placeBet is failed");
    });


    //플레이어는 베팅을 연속해서 두 번 할 수 없다(베팅한 후에는 항상 결과를 확인해야 한다).
    it("should have only one bet at a time", async () => {
        let instance = await coinToFlip.deployed();

        const val = 0.1;
        const mask = 1; //Tails 0000 0001

        try {
            await instance.placeBet(mask, {from:accounts[3], value:web3.utils.toWei(val.toString(), "ether")});
        } catch (error) {
            var err = error;
        }
        assert.isOk(err instanceof Error, "Player can bet more than two");
    });


});