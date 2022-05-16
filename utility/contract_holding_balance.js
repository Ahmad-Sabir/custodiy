const Web3 = require('web3');
const web3 = new Web3(process.env.ETH_LINK);
const axios = require('axios');
const checkBalance = require('./checkBalance');

module.exports = async (address) => {
    var contract_usdc = await checkBalance.contract_amount(address, 'USDC');
    var contract_usdt = await checkBalance.contract_amount(address, 'USDT');
    var contract_pax = await checkBalance.contract_amount(address, 'PAX');
    var contract_busd = await checkBalance.contract_amount(address, 'BUSD');
    var contract_cty = await checkBalance.contract_amount(address, 'CTY');
    var contract_eth = await checkBalance.contract_amount(address, 'ETH');
    var contract_bnb = await checkBalance.contract_amount(address, 'BNB');
    var usdc = await axios('https://min-api.cryptocompare.com/data/price?fsym=USDC&tsyms=USD,JPY,EUR');
    var usdt = await axios('https://min-api.cryptocompare.com/data/price?fsym=USDT&tsyms=USD,JPY,EUR');
    var pax = await axios('https://min-api.cryptocompare.com/data/price?fsym=PAX&tsyms=USD,JPY,EUR');
    var busd = await axios('https://min-api.cryptocompare.com/data/price?fsym=BUSD&tsyms=USD,JPY,EUR');
    var cty = await axios('https://min-api.cryptocompare.com/data/price?fsym=BUSD&tsyms=USD,JPY,EUR');
    var eth = await axios('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,JPY,EUR');
    var bnb = await axios('https://min-api.cryptocompare.com/data/price?fsym=BNB&tsyms=USD,JPY,EUR');
    var c_amount =
        contract_pax * pax.data.USD +
        contract_usdc * usdc.data.USD +
        contract_busd * busd.data.USD +
        contract_usdt * usdt.data.USD +
        contract_cty * cty.data.USD +
        contract_bnb * bnb.data.USD +
        contract_eth * eth.data.USD;
    return c_amount;
};
