import React, { Component } from 'react';

import {Grid, Row, Col, Panel, Image, Alert} from 'react-bootstrap';
import {Button, ButtonGroup, ButtonToolbar} from 'react-bootstrap';
import {InputGroup, FormControl, Radio} from 'react-bootstrap';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import {CoinHeads, CoinHeadsI, CoinTails, CoinTailsI, CoinUnknown} from './images';
import ModalWrapper from './ModalWrapper';

import './css/bootstrap.min.css';
import './css/style.css';

import getWeb3 from './utils/getWeb3';
import CoinToFlip from './contracts/CoinToFlip.json';


class CoinFlip extends Component {

    state = {
        web3: null,
        accounts: null,
        contract: null,

        houseBalance: 0,
        show: false,
        value: 0, //wager
        checked: 0, //coin
        reveal: 0,
        reward: 0,
        pending: false
    };

    constructor(props) {
        super(props);
    }

    handleClickCoin = (e) => {

        //TODO-1
        if (e.target.id === "Heads") {
            this.setState({checked: 2});
        } else if (e.target.id === "Tails") {
            this.setState({checked: 1});
        }
    };

    handleClickFlip = async () => {

        const {accounts, contract} = this.state;
        if (!this.state.web3) {
            console.log('App is not ready');
            return;
        }

        if (accounts[0] === undefined) {
            alert('Please press F5 to connect Dapp'); //need main page maybe?
            return;
        }
        this.setState({pending: true});
        //TODO-2
        try {
            await contract.methods.revealResult().send({from:accounts[0]});

            this.saveBetStatus("");
            this.setState({pending: false});

        } catch (error) {
            console.log(error.message);
            this.setState({pending: false});
        }
    };

    handleClickBet = async () => {

        const {web3, accounts, contract} = this.state;
        if (!this.state.web3) {
            console.log('App is not ready');
            return;
        }
        if (accounts[0] === undefined) {
            alert('Please press F5 to connect Dapp'); //Metamask account need to refresh page
            return;
        }


        if (this.state.value <= 0 || this.state.checked === 0) {
            this.setState({show: true});
        } else {
            this.setState({pending: true, show: false, reveal: 0, reward: 0,});
            try {

                if (!this.checkBetStatus()) {

        //TODO-3
        const r = await contract.methods.placeBet(this.state.checked).send(
            {from:accounts[0], value:web3.utils.toWei(String(this.state.value), 'ether')});

        console.log(r.transactionHash);
        this.saveBetStatus(r.transactionHash);
        this.setState({pending: false});

                }

            } catch (error) {
                console.log(error.message);
                this.setState({pending: false});
            }
        }
    }

    saveBetStatus = (txHash) => {
        localStorage.setItem('txHash', txHash);
        this.getHouseBalance();
    }

    checkBetStatus = () => {

        let bBet = false;
        if (localStorage.getItem("txHash") !== "") {
            this.setState({pending: false});
            alert('You have already bet 😅');
            bBet = true;
        }
        return bBet;
    }


    handleClickReset = () => {
        this.setState({value: 0, checked: 0, reveal: 0, reward: 0});

        this.saveBetStatus("");
        this.inputEth.value = '';
    }

    handleValChange = (e) => {
        this.setState({value: parseFloat(e.target.value)});
    }

    handleRefund = async () => {

        const {accounts, contract} = this.state;

        if (!this.state.web3) {
            console.log('App is not ready');
            return;
        }

        if (accounts[0] === undefined) {
            alert('Please press F5 to connect Dapp');
            return;
        }

        //TODO-5
        const r = await contract.methods.refundBet().send({from:accounts[0]});
        if (r.transactionHash !== "") {
            this.saveBetStatus("");
        }
    }


    getHouseBalance = () => {
        const {web3, contract} = this.state;

        web3.eth.getBalance(contract._address, (e, r) => {
            this.setState({houseBalance: web3.utils.fromWei(r, 'ether')});
        });
    };


    watchEvent = (event) => {
        //console.log(event.returnValues);
        const {web3} = this.state;
        const reveal = parseInt(event.returnValues.reveal);
        const reward = web3.utils.fromWei(event.returnValues.amount.toString(), 'ether');
        this.setState({reveal, reward});
    };


    async componentDidMount() {

        try {
            // Get network provider and web3 instance.
            const web3 = await getWeb3();

            // Use web3 to get the user's accounts.
            let accounts = await web3.eth.getAccounts();

            // Get the contract instance.
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = CoinToFlip.networks[networkId];
            const instance = new web3.eth.Contract(
                CoinToFlip.abi,
                deployedNetwork && deployedNetwork.address,
            );

            //TODO-4
            instance.events.Reveal()
                .on('data', (event) => this.watchEvent(event))
                .on('error', (error) => console.log(error));

            this.setState({web3, accounts, contract: instance}, this.getHouseBalance);

        } catch (error) {
            // Catch any errors for any of the above operations.
            alert('Failed to load web3, accounts, or contract. Check console for details.');
            console.log(error);
        }
    }


    render() {

        let coin_h = CoinHeadsI;
        let coin_t = CoinTailsI;

        if (this.state.checked === 2) {
            coin_h = CoinHeads;
        } else if (this.state.checked === 1) {
            coin_t = CoinTails;
        }

        return (

            <Grid fluid={true}>
                <Row>
                    <Col md={5}>

                        <Panel bsStyle="info">
                            <Panel.Heading>
                                <Panel.Title>
                                    <Glyphicon glyph="thumbs-up" /> House: {this.state.houseBalance} ETH
                                </Panel.Title>
                            </Panel.Heading>
                            <Panel.Body className="custom-align-center">
                                <div>
                                    <Image src={coin_h} id="Heads" onClick={this.handleClickCoin} className="img-coin" />
                                    <Image src={coin_t} id="Tails" onClick={this.handleClickCoin} className="img-coin" />
                                </div>
                            </Panel.Body>
                        </Panel>
                    </Col>
                    <Col md={5}>
                        <Reveal reveal={this.state.reveal} reward={this.state.reward} />
                    </Col>
                </Row>

                <Row>
                    <Col md={5}>
                        <Panel bsStyle="info">
                            <Panel.Heading>
                                <Panel.Title>
                                    <Glyphicon glyph="ok-circle" /> Your Bet
                                </Panel.Title>
                            </Panel.Heading>
                            <Panel.Body className="custom-align-center">

                                <form>
                                    <InputGroup style={{paddingBottom:'10px'}}>
                                        <Radio name="coinRadioGroup" id="Heads" onChange={this.handleClickCoin} checked={this.state.checked === 2} inline>
                                            Heads
                                        </Radio>{' '}
                                        <Radio name="coinRadioGroup" id="Tails" onChange={this.handleClickCoin} checked={this.state.checked === 1} inline>
                                            Tails
                                        </Radio>
                                    </InputGroup>
                                    <InputGroup style={{paddingBottom:'10px'}}>
                                        <InputGroup.Addon>ETH</InputGroup.Addon>
                                        <FormControl type="number" placeholder="Enter number" bsSize="lg"
                                                     onChange={this.handleValChange} inputRef={(ref)=>this.inputEth=ref}/>
                                    </InputGroup>
                                    <AlertMsg flag={this.state.show}/>
                                </form>

                                <ButtonToolbar>
                                    <ButtonGroup justified>
                                        <Button href="#" bsStyle="primary" bsSize="large" onClick={this.handleClickBet}>
                                            Bet
                                        </Button>
                                        <Button href="#" bsStyle="success" bsSize="large" onClick={this.handleClickFlip}>
                                            Flip!
                                        </Button>
                                        <Button href="#" bsSize="large" onClick={this.handleRefund}>
                                            Refund
                                        </Button>
                                        <Button href="#" bsStyle="info" bsSize="large" onClick={this.handleClickReset}>
                                            Clear
                                        </Button>
                                    </ButtonGroup>
                                </ButtonToolbar>

                            </Panel.Body>
                        </Panel>
                    </Col>
                    <Col md={5}>
                        <Panel bsStyle="info">
                            <Panel.Heading>
                                <Panel.Title>
                                    <Glyphicon glyph="signal" /> Transactions
                                </Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <b>{localStorage.getItem("txHash")!==""?"BET":null}</b>
                            </Panel.Body>
                        </Panel>
                    </Col>
                </Row>
                {this.state.pending?<PendingModal>Ready to Send Your Transaction...</PendingModal>:null}
            </Grid>

        )
    }
}

//functional component
function AlertMsg(props) {

    if (props.flag) {
        return (
            <Alert bsStyle="danger">
                <strong>You should flip the coin and bet bigger than 0.01 ETH</strong>
            </Alert>
        )
    }
    return <br/>
}

//functional component
function Reveal(props) {

    let coinImg = CoinUnknown;
    if (props.reveal === 2) {
        coinImg = CoinHeads;
    } else if (props.reveal === 1) {
        coinImg = CoinTails;
    }

    let coin = <Image src={coinImg} className="img-coin" />

    return (
        <Panel bsStyle="info">
            <Panel.Heading>
                <Panel.Title>
                    <Glyphicon glyph="adjust"/> Coin Reveal
                </Panel.Title>
            </Panel.Heading>
            <Panel.Body className="custom-align-center">
                {coin}
                {props.reward} ETH
            </Panel.Body>
        </Panel>
    );
}


const PendingModal = ({children}) => (
    <ModalWrapper>
        <div style={{marginBottom: '10px'}}>{children}</div>
    </ModalWrapper>
);


export default CoinFlip;