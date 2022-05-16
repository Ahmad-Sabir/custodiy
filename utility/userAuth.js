const Web3 = require('web3');
const fs = require('fs');
const Contract = require('../models/TransactionModel');
var registerModel = require('../models/authUser');
const otpModel = require('../models/otpModel');
var CryptoJS = require('crypto-js');
const User = require('../models/User');
var generateOtp = async () => {
    var val = Math.floor(1000 + Math.random() * 9000);
    return val;
};
var register = async (email, firstName, lastName, password, token) => {
    const web3 = new Web3(process.env.JSON_RPC_SOCKET);
    let tokenAddress = process.env.MAIN_CONTRACT_ADDRESS;
    var abiArray = JSON.parse(fs.readFileSync('updatedabi.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);

    await web3.eth.accounts.wallet.add(process.env.ADMIN_PRIVATE_KEY);
    var userAccount = await web3.eth.accounts.create();
    var privateKey = CryptoJS.AES.encrypt(
        userAccount.privateKey,
        process.env.crypto_secret
    ).toString();
    let result = await instance.methods
        .register(userAccount.address, firstName, lastName, password, email, privateKey)
        .send({ from: process.env.ADMIN_ADDRESS, gas: 2000000 });
    var name = firstName.toLowerCase() + ' ' + lastName.toLowerCase();
    const data = new User();
    data.address = userAccount.address;
    data.email = email;
    data.name = name;
    data.privateKey = privateKey;
    data.send_USDT = 0;
    data.send_USDC = 0;
    data.send_PAX = 0;
    data.send_BUSD = 0;
    data.send_BNB = 0;
    data.send_ETH = 0;
    data.received_USDT = 0;
    data.received_USDC = 0;
    data.received_BUSD = 0;
    data.received_PAX = 0;
    data.received_ETH = 0;
    data.received_BNB = 0;
    await data.save();

    return {
        address: userAccount.address,
        firstName: firstName,
        lastName: lastName,
        email: data.email,
        token,
    };
};
var remove_unvarified_user = async () => {
    try {
        await registerModel.deleteMany({
            emailVerificationOtpExpires: { $lt: Date.now() },
        });
    } catch (e) {
        console.log('Failed to expire otp');
    }
};

var remove_from_otp = async () => {
    try {
        await otpModel.deleteMany({
            updatedAt: { $lte: Date.now() - 26 * 60 * 1000 },
        });
        console.log(`${Date.now()} done`);
    } catch (e) {
        console.log('Failed to expire otp');
    }
};

module.exports = {
    generateOtp,
    register,
    remove_unvarified_user,
    remove_from_otp,
};
