const Web3 = require('web3');
const fs = require('fs');
const User = require('../models/User');

module.exports = async (email) => {
    const web3 = new Web3(process.env.JSON_RPC_SOCKET);
    const tokenAddress = process.env.MAIN_CONTRACT_ADDRESS;
    var abiArray = JSON.parse(fs.readFileSync('updatedabi.json', 'utf-8'));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);

    await web3.eth.accounts.wallet.add(process.env.ADMIN_PRIVATE_KEY);

    try {
        var user = await User.find({ email: email });
        const [response] = user;
        let receipt = await instance.methods
            .forgotPassword(response.address, email)
            .send({ from: process.env.ADMIN_ADDRESS, gas: 3000000 });
        let otp = await instance.methods
            .returnOtp(response.address)
            .call({ from: process.env.ADMIN_ADDRESS });
        return otp;
    } catch (e) {
        return 'Email not found!';
    }
};
