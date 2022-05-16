const Web3 = require('web3');
const fs = require('fs');
const Contract = require('../models/TransactionModel');
const User = require('../models/User');
const axios = require('axios');
var jwt = require('jsonwebtoken');
const checkBalance = require('../utility/checkBalance');
var contract_hold_Balance = require('../utility/contract_holding_balance');
const web3 = new Web3(process.env.ETH_LINK);
const web3Busd = new Web3(process.env.ETH_LINK);
const web3BNB = new Web3(process.env.BNB_LINK);

var get_eth_price = async (req, res) => {
    try {
        var value = req.user;
        var eth_balance = await web3.eth.getBalance(value.address);
        var balance = await web3.utils.fromWei(eth_balance, 'ether');
        balance =
            balance -
            (await checkBalance.contract_holding_gas(value.address)) -
            (await checkBalance.contract_holding_amount(value.address, 'ETH'));
        var response = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=ETH');
        var [data] = response.data.data;
        var eth_price = data.price;
        var hours_24_changes = data.percent_change_24h;
        res.status(200).send({
            status: 200,
            success: true,
            eth_price: eth_price.toFixed(2),
            hours_24_changes: hours_24_changes,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        res.status(404).send({
            status: 404,
            success: false,
            Message: 'Failed to find balance',
        });
    }
};

var get_bnb_price = async (req, res) => {
    try {
        var value = req.user;
        var eth_balance = await web3BNB.eth.getBalance(value.address);
        var balance = await web3BNB.utils.fromWei(eth_balance, 'ether');
        balance =
            balance -
            (await checkBalance.contract_holding_gas_BNB(value.address)) -
            (await checkBalance.contract_holding_amount(value.address, 'BNB'));
        console.log(balance);
        var response = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BNB');
        var [data] = response.data.data;
        var eth_price = data.price;
        var hours_24_changes = data.percent_change_24h;
        res.status(200).send({
            status: 200,
            success: true,
            bnb_price: eth_price.toFixed(2),
            hours_24_changes: hours_24_changes,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        res.status(404).send({
            status: 404,
            success: false,
            Message: 'Failed to find balance',
        });
    }
};

var get_USDT_price = async (req, res) => {
    var tokenAddress = process.env.usdt_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('usdt.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);
    try {
        var value = req.user;
        var user_token = await instance.methods.balanceOf(value.address).call();
        var balance = await web3.utils.fromWei(user_token, 'mwei');
        var amount = await web3.utils.fromWei(
            await checkBalance.contract_holding_amount(value.address, 'USDT'),
            'mwei'
        );
        console.log(amount);
        balance = balance - amount;
        var response = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=USDT');
        var [data] = response.data.data;
        var eth_price = data.price;
        var hours_24_changes = data.percent_change_24h;

        res.status(200).send({
            status: 200,
            success: true,
            USDT_price: eth_price.toFixed(2),
            hours_24_changes: hours_24_changes,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        console.log(e);
        res.status(404).send({
            status: 404,
            success: false,
            Message: 'Failed to find balance',
        });
    }
};

var get_BUSD_price = async (req, res) => {
    var tokenAddress = process.env.busd_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
    var instance = new web3Busd.eth.Contract(abiArray, tokenAddress);
    try {
        var value = req.user;
        var user_token = await instance.methods.balanceOf(value.address).call();
        var balance = await web3Busd.utils.fromWei(user_token, 'ether');
        var amount = await web3Busd.utils.fromWei(
            await checkBalance.contract_holding_amount(value.address, 'BUSD'),
            'ether'
        );
        console.log(amount, balance);
        balance = balance - amount;
        var response = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BUSD');
        var [data] = response.data.data;
        var eth_price = data.price;
        var hours_24_changes = data.percent_change_24h;

        res.status(200).send({
            status: 200,
            success: true,
            BUSD_price: eth_price.toFixed(2),
            hours_24_changes: hours_24_changes,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        res.status(404).send({
            status: 404,
            success: false,
            Message: 'Failed to find balance',
        });
    }
};

var get_CTY_price = async (req, res) => {
    var tokenAddress = process.env.cty_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
    var instance = new web3BNB.eth.Contract(abiArray, tokenAddress);
    try {
        var value = req.user;
        var user_token = await instance.methods.balanceOf(value.address).call();
        var balance = await web3BNB.utils.fromWei(user_token, 'ether');
        console.log(balance);
        var response = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BUSD');
        var [data] = response.data.data;
        var eth_price = data.price;
        var hours_24_changes = data.percent_change_24h;

        res.status(200).send({
            status: 200,
            success: true,
            CTY_price: eth_price.toFixed(2),
            hours_24_changes: hours_24_changes,
            balance: Number(balance).toFixed(2),
        });
    } catch (e) {
        console.log(e);
        res.status(404).send({
            status: 404,
            success: false,
            Message: 'Failed to find balance',
        });
    }
};

var get_USDC_price = async (req, res) => {
    var tokenAddress = process.env.usdc_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('usdc.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);
    try {
        var value = req.user;
        var user_token = await instance.methods.balanceOf(value.address).call();
        var balance = await web3.utils.fromWei(user_token, 'mwei');
        var amount = await web3.utils.fromWei(
            await checkBalance.contract_holding_amount(value.address, 'USDC'),
            'mwei'
        );
        console.log(amount);
        balance = balance - amount;
        var response = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=USDC');
        var [data] = response.data.data;
        var eth_price = data.price;
        var hours_24_changes = data.percent_change_24h;

        res.status(200).send({
            status: 200,
            success: true,
            USDC_price: eth_price.toFixed(2),
            hours_24_changes: hours_24_changes,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        console.log(e);
        res.status(404).send({
            status: 404,
            success: false,
            Message: 'Failed to find price',
        });
    }
};
var get_PAX_price = async (req, res) => {
    var tokenAddress = process.env.pax_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('pax.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);
    try {
        var value = req.user;
        var user_token = await instance.methods.balanceOf(value.address).call();
        var balance = await web3.utils.fromWei(user_token, 'ether');
        var amount = await web3.utils.fromWei(
            await checkBalance.contract_holding_amount(value.address, 'PAX'),
            'ether'
        );
        console.log(amount);
        balance = balance - amount;
        var response = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=PAX');
        var [data] = response.data.data;
        var eth_price = data.price;
        var hours_24_changes = data.percent_change_24h;

        res.status(200).send({
            status: 200,
            success: true,
            PAX_price: eth_price.toFixed(2),
            hours_24_changes: hours_24_changes,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        res.status(404).send({
            status: 404,
            success: false,
            Message: 'failed to find price',
        });
    }
};
var usdc_balance = async (req, res) => {
    var tokenAddress = process.env.usdc_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('usdc.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);
    try {
        var user_token = await instance.methods.balanceOf(req.body.user).call();
        var balance = await web3.utils.fromWei(user_token, 'mwei');
        var amount = await checkBalance.contract_holding_amount(req.body.user, 'USDC');
        console.log(amount);
        balance = balance - amount;
        res.status(200).send({
            status: 200,
            success: true,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Fail to find price',
        });
    }
};
var usdt_balance = async (req, res) => {
    var tokenAddress = process.env.usdt_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('usdt.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);
    try {
        var user_token = await instance.methods.balanceOf(req.body.user).call();
        var balance = await web3.utils.fromWei(user_token, 'mwei');
        var amount = await checkBalance.contract_holding_amount(req.body.user, 'USDT');
        console.log(amount);
        balance = balance - amount;
        res.status(200).send({
            status: 200,
            success: true,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Fail to find price',
        });
    }
};

var busd_balance = async (req, res) => {
    var tokenAddress = process.env.busd_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
    var instance = new web3Busd.eth.Contract(abiArray, tokenAddress);
    try {
        var user_token = await instance.methods.balanceOf(req.body.user).call();
        var balance = await web3Busd.utils.fromWei(user_token, 'ether');
        var amount = await checkBalance.contract_holding_amount(req.body.user, 'BUSD');
        console.log(amount);
        balance = balance - amount;
        res.status(200).send({
            status: 200,
            success: true,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Fail to find price',
        });
    }
};

var cty_balance = async (req, res) => {
    var tokenAddress = process.env.cty_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
    var instance = new web3BNB.eth.Contract(abiArray, tokenAddress);
    try {
        var user_token = await instance.methods.balanceOf(req.body.user).call();
        var balance = await web3BNB.utils.fromWei(user_token, 'ether');
        console.log(balance);
        res.status(200).send({
            status: 200,
            success: true,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        console.log(e);
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Fail to find price',
        });
    }
};

var pax_balance = async (req, res) => {
    var tokenAddress = process.env.pax_contract_address;
    var abiArray = JSON.parse(fs.readFileSync('pax.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);
    try {
        var user_token = await instance.methods.balanceOf(req.body.user).call();
        var balance = await web3.utils.fromWei(user_token, 'ether');
        var amount = await checkBalance.contract_holding_amount(req.body.user, 'PAX');
        console.log(amount);
        balance = balance - amount;
        res.status(200).send({
            status: 200,
            success: true,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Fail to find price',
        });
    }
};
var total_usd_balance = async (req, res) => {
    var pax_Address = process.env.pax_contract_address;
    var pax_abiArray = JSON.parse(fs.readFileSync('pax.json', 'utf-8'));
    var pax_instance = new web3.eth.Contract(pax_abiArray, pax_Address);
    var usdt_Address = process.env.usdt_contract_address;
    var usdt_abiArray = JSON.parse(fs.readFileSync('usdt.json', 'utf-8'));
    var usdt_instance = new web3.eth.Contract(usdt_abiArray, usdt_Address);
    var usdc_Address = process.env.usdc_contract_address;
    var usdc_abiArray = JSON.parse(fs.readFileSync('usdc.json', 'utf-8'));
    var usdc_instance = new web3.eth.Contract(usdc_abiArray, usdc_Address);
    var busd_Address = process.env.busd_contract_address;
    var busd_abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
    var busd_instance = new web3Busd.eth.Contract(busd_abiArray, busd_Address);
    var cty_Address = process.env.cty_contract_address;
    var cty_abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
    var cty_instance = new web3BNB.eth.Contract(cty_abiArray, cty_Address);
    try {
        var bal = await contract_hold_Balance(req.user.address);
        var user_pax_token = await pax_instance.methods.balanceOf(req.user.address).call();
        var user_usdc_token = await usdc_instance.methods.balanceOf(req.user.address).call();
        var user_usdt_token = await usdt_instance.methods.balanceOf(req.user.address).call();
        var user_busd_token = await busd_instance.methods.balanceOf(req.user.address).call();
        var user_cty_token = await cty_instance.methods.balanceOf(req.user.address).call();
        var eth_balance = await web3.eth.getBalance(req.user.address);
        var bnb_balance = await web3BNB.eth.getBalance(req.user.address);
        var pax = await web3.utils.fromWei(user_pax_token, 'ether');
        var usdc = await web3.utils.fromWei(user_usdc_token, 'mwei');
        var usdt = await web3.utils.fromWei(user_usdt_token, 'mwei');
        var busd = await web3Busd.utils.fromWei(user_busd_token, 'ether');
        var cty = await web3BNB.utils.fromWei(user_cty_token, 'ether');
        var eth = await web3.utils.fromWei(eth_balance, 'ether');
        var bnb = await web3BNB.utils.fromWei(bnb_balance, 'ether');
        console.log(await checkBalance.contract_holding_gas(req.user.address));
        eth = Number(eth) - (await checkBalance.contract_holding_gas(req.user.address));
        bnb = Number(bnb) - (await checkBalance.contract_holding_gas_BNB(req.user.address));
        console.log(eth, pax, usdc, usdt, busd, bnb, cty);
        var usd_per_usdc = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=USDC');
        var usd_per_usdt = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=USDT');
        var usd_per_pax = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=PAX');
        var usd_per_busd = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BUSD');
        var usd_per_cty = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BUSD');
        var usd_per_eth = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=ETH');
        var usd_per_bnb = await axios('https://api.lunarcrush.com/v2?data=assets&symbol=BNB');
        var [_usdc] = usd_per_usdc.data.data;
        var [_usdt] = usd_per_usdt.data.data;
        var [_pax] = usd_per_pax.data.data;
        var [_eth] = usd_per_eth.data.data;
        var [_busd] = usd_per_busd.data.data;
        var [_cty] = usd_per_cty.data.data;
        var [_bnb] = usd_per_bnb.data.data;
        var amount =
            Number(pax) * _pax.price +
            Number(usdc) * _usdc.price +
            Number(usdt) * _usdt.price +
            Number(busd) * _busd.price +
            Number(cty) * _cty.price +
            Number(eth) * _eth.price +
            Number(bnb) * _bnb.price;
        var total_balance = amount - bal;
        res.status(200).send({
            status: 200,
            success: true,
            balance: total_balance.toFixed(2),
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Fail to find price',
        });
    }
};
var ethereum_balance = async (req, res) => {
    try {
        var eth_balance = await web3.eth.getBalance(req.body.user);
        var balance = await web3.utils.fromWei(eth_balance, 'ether');
        res.status(200).send({
            status: 200,
            success: true,
            balance: balance.toFixed(2),
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Failed to find balance',
        });
    }
};

const conversion = async (req, res) => {
    try {
        if (!req.body.coin || !req.body.amount) {
            res.status(400).send({
                status: 400,
                success: false,
                Message: 'coin an amount required',
            });
        }
        var conversionUSD = await axios(
            `https://min-api.cryptocompare.com/data/price?fsym=${req.body.coin}&tsyms=USD`
        );
        var conversionBTC = await axios(
            `https://min-api.cryptocompare.com/data/price?fsym=${req.body.coin}&tsyms=BTC`
        );
        res.status(200).send({
            status: 200,
            success: true,
            result: {
                USD: Number(req.body.amount) * Number(conversionUSD.data.USD),
                BTC: Number(req.body.amount) * Number(conversionBTC.data.BTC),
            },
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Request Failed',
        });
    }
};
module.exports = {
    conversion,
    get_eth_price,
    get_bnb_price,
    get_USDT_price,
    get_USDC_price,
    get_BUSD_price,
    get_PAX_price,
    usdc_balance,
    usdt_balance,
    busd_balance,
    pax_balance,
    cty_balance,
    total_usd_balance,
    get_CTY_price,
    ethereum_balance,
};
