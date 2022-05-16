const Contract = require('../models/TransactionModel');
const User = require('../models/User');
const Web3 = require('web3');
const fs = require('fs');
const axios = require('axios');
const web3 = new Web3(process.env.ETH_LINK);
const web3BNB = new Web3(process.env.BNB_LINK);
var contract_holding_amount = async (address, symbol) => {
    var contract = await Contract.find({
        Transfer: address,
        Symbol: symbol,
        status: 'Waiting',
    });
    var amount = 0;
    let wei_amount;
    for (let x of contract) {
        amount = amount + Number(x.Amount);
    }
    if (['PAX', 'BUSD'].includes(symbol)) {
        wei_amount = await web3.utils.toWei(amount.toString(), 'ether');
    } else if (symbol == 'CTY') {
        wei_amount = await web3BNB.utils.toWei(amount.toString(), 'ether');
        console.log(wei_amount);
    } else if (symbol == 'BNB') {
        wei_amount = amount;
        console.log(wei_amount);
    } else if (symbol == 'ETH') {
        wei_amount = amount;
    } else {
        wei_amount = await web3.utils.toWei(amount.toString(), 'mwei');
    }
    return wei_amount;
};
var contract_holding_gas = async (address) => {
    console.log(address);
    var contract = await Contract.find({
        Transfer: address,
        status: 'Waiting',
        type: 'contract',
        //Symbol: { $in: ['USDC', 'USDT', 'PAX', 'ETH'] },
        Symbol: { $in: ['USDC', 'USDT', 'PAX', 'ETH', 'BUSD'] },
    });
    //console.log(contract)
    var amount = 0;
    if (contract.length > 0) {
        for (let x of contract) {
            if (x.onHoldGas) {
                //console.log(x.onHoldGas);
                amount = amount + x.onHoldGas;
            } else {
                amount = amount + 0;
            }
        }
    }
    console.log(amount, 'total');
    return amount;
};

var contract_holding_gas_BNB = async (address) => {
    //console.log(address)
    var contract = await Contract.find({
        Transfer: address,
        status: 'Waiting',
        type: 'contract',
        //Symbol: { $in: ['BUSD', 'BNB'] },
        Symbol: { $in: ['BNB', 'CTY'] },
    });
    //console.log(contract)
    var amount = 0;
    if (contract.length > 0) {
        for (let x of contract) {
            if (x.onHoldGas) {
                //console.log(x.onHoldGas);
                amount = amount + x.onHoldGas;
            } else {
                amount = amount + 0;
            }
        }
    }
    //console.log(amount,'total')
    return amount;
};

var gasFees = async () => {
    let data = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=ETH`);
    const gas = data.data.ETH * 100;
    //console.log(gas,'here');
    return gas;
};

var gasFeesBnb = async () => {
    let data = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=BNB`);
    const gas = data.data.BNB * 1;
    //console.log(gas,'here');
    return gas;
};
var getBNBBalance = async (address) => {
    var eth_balance = await web3BNB.eth.getBalance(address);
    var balance = await web3BNB.utils.fromWei(eth_balance, 'ether');
    return balance;
};
var getEthBalance = async (address) => {
    var eth_balance = await web3.eth.getBalance(address);
    var balance = await web3.utils.fromWei(eth_balance, 'ether');
    return balance;
};
var is_contract_exist = async (address) => {
    var contract = await Contract.find({ Transfer: address });
    if (contract.length != 0) {
        return true;
    } else {
        return false;
    }
};
var send_usd = async (address) => {
    var user = await User.find({ address: address });
    const [response] = user;
    try {
        var usd_per_usdc = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=USDC');
        var usd_per_usdt = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=USDT');
        var usd_per_pax = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=PAX');
        var usd_per_busd = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BUSD');
        var usd_per_cty = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BUSD');
        var usd_per_bnb = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BNB');
        var usd_per_eth = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=ETH');

        var [_usdc] = usd_per_usdc.data.data;
        var [_usdt] = usd_per_usdt.data.data;
        var [_pax] = usd_per_pax.data.data;
        var [_busd] = usd_per_busd.data.data;
        var [_bnb] = usd_per_bnb.data.data;
        var [_eth] = usd_per_eth.data.data;
        var [_cty] = usd_per_cty.data.data;
        var usd =
            _usdt.price * response.send_USDT +
            _usdc.price * response.send_USDC +
            _busd.price * response.send_BUSD +
            _cty.price * response.send_CTY +
            _pax.price * response.send_PAX +
            _bnb.price * response.send_BNB +
            _eth.price * response.send_ETH;
        return usd;
    } catch (e) {
        //console.log(e.message);
        var Message = 'Failed to find balance';
        return Message;
    }
};
var received_usd = async (address) => {
    var user = await User.find({ address: address });
    const [response] = user;
    try {
        var usd_per_usdc = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=USDC');
        var usd_per_usdt = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=USDT');
        var usd_per_pax = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=PAX');
        var usd_per_busd = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BUSD');
        var usd_per_bnb = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BNB');
        var usd_per_eth = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=ETH');
        var usd_per_cty = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BUSD');

        var [_usdc] = usd_per_usdc.data.data;
        var [_usdt] = usd_per_usdt.data.data;
        var [_pax] = usd_per_pax.data.data;
        var [_busd] = usd_per_busd.data.data;
        var [_bnb] = usd_per_bnb.data.data;
        var [_cty] = usd_per_cty.data.data;
        var [_eth] = usd_per_eth.data.data;

        var usd =
            _usdt.price * response.received_USDT +
            _usdc.price * response.received_USDC +
            _busd.price * response.received_BUSD +
            _pax.price * response.received_PAX +
            _cty.price * response.received_CTY +
            _bnb.price * response.received_BNB +
            _eth.price * response.received_ETH;
        return usd;
    } catch (e) {
        var Message = 'Failed to find balance';
        return Message;
    }
};
var contract_amount = async (address, symbol) => {
    var contract = await Contract.find({
        Transfer: address,
        Symbol: symbol,
        status: 'Waiting',
    });
    var amount = 0;
    for (let x of contract) {
        amount = amount + Number(x.Amount);
    }

    return amount;
};

var cty_balance = async (value) => {
    let tokenAddress = process.env.cty_contract_address;
    let abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
    var instance = new web3BNB.eth.Contract(abiArray, tokenAddress);
    var user_token = await instance.methods.balanceOf(value.address).call();
    var balance = await web3BNB.utils.fromWei(user_token, 'ether');
    console.log(balance);
    return balance;
};

module.exports = {
    contract_holding_amount,
    send_usd,
    received_usd,
    is_contract_exist,
    contract_amount,
    contract_holding_gas,
    getEthBalance,
    gasFees,
    gasFeesBnb,
    cty_balance,
    getBNBBalance,
    contract_holding_gas_BNB,
};
