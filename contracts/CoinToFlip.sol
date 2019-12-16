pragma solidity 0.5.8;

// ----------------------------------------------------------------------------
// CoinToFlip.sol
// Simple Coin flip game
// ----------------------------------------------------------------------------
contract CoinToFlip {

    uint constant MAX_CASE = 2; // for coin
    uint constant MIN_BET = 0.01 ether;
    uint constant MAX_BET = 10 ether;
    uint constant HOUSE_FEE_PERCENT = 5;
    uint constant HOUSE_MIN_FEE = 0.005 ether;

    address payable public owner;
    uint public lockedInBets;

    struct Bet {
        uint amount;
        uint8 numOfBetBit;
        uint placeBlockNumber; // Block number of Bet tx.
        // Bit mask representing winning bet outcomes
        // 0000 0010 for front side of coin, 50% chance
        // 0000 0001 for back side of coin, 50% chance
        // 0000 0011 for both sides,  100% chance - no reward!
        uint8 mask;
        address payable gambler; // Address of a gambler, used to pay out winning bets.
    }

    mapping (address => Bet) bets; //Bet book

    event Reveal(address indexed gambler, uint reveal, uint amount);//1 or 2
    event Payment(address indexed beneficiary, uint amount);
    event FailedPayment(address indexed beneficiary, uint amount);


    constructor () public {
        owner = msg.sender;
    }

    // Standard modifier on methods invokable only by contract owner.
    modifier onlyOwner {
        require (msg.sender == owner, "Only owner can call this function.");
        _;
    }


    // Funds withdrawal to maintain the house
    function withdrawFunds(address payable beneficiary, uint withdrawAmount) external onlyOwner {
        require (withdrawAmount + lockedInBets <= address(this).balance, "larger than balance.");
        sendFunds(beneficiary, withdrawAmount);
    }


    function kill() external onlyOwner {
        require (lockedInBets == 0, "All bets should be processed before self-destruct.");
        selfdestruct(owner);
    }


    function () external payable {}


    //Bet by player
    function placeBet(uint8 betMask) external payable {

        uint amount = msg.value;

        require (amount >= MIN_BET && amount <= MAX_BET, "Amount is out of range.");
        require (betMask > 0 && betMask < 256, "Mask should be 8 bit");

        Bet storage bet = bets[msg.sender]; //mapping bets(address => Bet)

        require (bet.gambler == address(0), "Bet should be empty state."); //can place a bet

        //count bet bit in the betMask
        //0000 0011  number of bits = 2
        //0000 0001  number of bits = 1
        uint8 numOfBetBit = countBits(betMask);

        // need to lock possible winning amount to pay
        uint possibleWinningAmount = getWinningAmount(amount, numOfBetBit);
        lockedInBets += possibleWinningAmount;

        // Check whether house has enough ETH to pay the bet.
        require(lockedInBets < address(this).balance, "Cannot afford to pay the bet.");

        bet.amount = amount;
        bet.numOfBetBit = numOfBetBit;
        bet.placeBlockNumber = block.number;
        bet.mask = betMask;
        bet.gambler = msg.sender;
    }

    function getWinningAmount(uint amount, uint8 numOfBetBit) private pure returns (uint winningAmount) {

        require (0 < numOfBetBit && numOfBetBit < MAX_CASE, "Probability is out of range"); // 1

        uint houseFee = amount * HOUSE_FEE_PERCENT / 100;

        if (houseFee < HOUSE_MIN_FEE) {
            houseFee = HOUSE_MIN_FEE;
        }

        //reward is depends on your own idea
        uint reward = amount / (MAX_CASE + (numOfBetBit-1));

        winningAmount = (amount - houseFee) + reward;
    }

    //
    //Reveal the coin by player
    function revealResult() external {

        Bet storage bet = bets[msg.sender];
        uint amount = bet.amount;
        uint8 numOfBetBit = bet.numOfBetBit;
        uint placeBlockNumber = bet.placeBlockNumber;
        address payable gambler = bet.gambler;

        require (amount > 0, "Bet should be in an active state");

        // should be called after placeBet
        require(block.number > placeBlockNumber, "revealResult in the same block as placeBet, or before.");

        //RNG(Random Number Generator)
        bytes32 random = keccak256(abi.encodePacked(blockhash(block.number), blockhash(placeBlockNumber)));
        uint reveal = uint(random) % MAX_CASE; // 0 or 1

        uint winningAmount = 0;
        uint possibleWinningAmount = 0;
        possibleWinningAmount = getWinningAmount(amount, numOfBetBit);

        if ((2 ** reveal) & bet.mask != 0) {
            winningAmount = possibleWinningAmount;
        }

        emit Reveal(gambler, 2 ** reveal, winningAmount);

        lockedInBets -= possibleWinningAmount;
        clearBet(msg.sender);

        if (winningAmount > 0) {
            sendFunds(gambler, winningAmount);
        }
    }

    function sendFunds(address payable beneficiary, uint amount) private {

        if (beneficiary.send(amount)) {
            emit Payment(beneficiary, amount);
        } else {
            // 실패하는 경우 대책은?
            emit FailedPayment(beneficiary, amount);
        }
    }


    function clearBet(address player) private {
        Bet storage bet = bets[player];

        bet.amount = 0;
        bet.numOfBetBit = 0;
        bet.placeBlockNumber = 0;
        bet.mask = 0;
        bet.gambler = address(0);
    }


    //can refund before reveal
    function refundBet() external {

        Bet storage bet = bets[msg.sender];

        uint8 numOfBetBit = bet.numOfBetBit;
        uint amount = bet.amount;
        address payable gambler = bet.gambler;

        // Check that bet has been already mined.
        require(block.number > bet.placeBlockNumber, "refundBet in the same block as placeBet, or before.");
        require(amount > 0, "Bet should be in an active state");

        uint possibleWinningAmount;
        possibleWinningAmount = getWinningAmount(amount, numOfBetBit);

        lockedInBets -= possibleWinningAmount;
        clearBet(msg.sender);

        // Send the refund.
        sendFunds(gambler, amount);
    }


    function checkHouseFund() public view onlyOwner returns(uint) {
        return address(this).balance;
    }


    function countBits(uint8 _num) internal pure returns (uint8){
        uint8 count;
        while (_num > 0){
            count += _num & 1;
            _num >>= 1;
        }
        return count;
    }
}
