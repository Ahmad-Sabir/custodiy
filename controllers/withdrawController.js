const Web3 = require('web3');
var Tx = require('ethereumjs-tx').Transaction;
const fs = require('fs');
const User = require('../models/User');
const WithDraw = require('../models/withdraw');
const update_received_token = require('../utility/update_received_token');
const update_send_token = require('../utility/update_send_token');
const checkBalance = require('../utility/checkBalance');
const Transaction_Status = require('../utility/Update_Transaction_status');
const { send_cty_to_admin } = require('../controllers/sendTokenController');
var CryptoJS = require('crypto-js');
var jwt = require('jsonwebtoken');
const web3 = new Web3(process.env.ETH_LINK);
const web3Busd = new Web3(process.env.ETH_LINK);
const web3BNB = new Web3(process.env.BNB_LINK);

var getPayouts = async (req, res) => {
    try {
        const value = `^${req.user.address}$`;
        const payouts = await WithDraw.find({ source: { $regex: value, $options: 'i' } });
        return res.status(200).send({
            status: 200,
            success: true,
            result: payouts,
        });
    } catch (e) {
        return res.status(400).send({
            status: 400,
            Error: 'something went wrong',
        });
    }
};

var getOnePayout = async (req, res) => {
    try {
        if (!req.body.id) {
            return res.status(400).send({
                status: 400,
                Error: 'id is required',
            });
        }
        const value = `^${req.user.address}$`;
        const payout = await WithDraw.findOne({
            _id: req.body.id,
            source: { $regex: value, $options: 'i' },
        });
        return res.status(200).send({
            status: 200,
            success: true,
            result: payout,
        });
    } catch (e) {
        return res.status(400).send({
            status: 400,
            Error: 'something went wrong',
        });
    }
};

var withDraw = async (req, res) => {
    let value = req.user;
    const d = new Date();
    let response;
    let key;
    req.body.amount = String(req.body.amount);
    try {
        var user = await User.find({ email: value.email });
        if (user.length == 0)
            res.status(400).send({
                status: 400,
                Error: 'Invalid User',
            });
        const [rs] = user;
        response = rs;
        if (!web3.utils.isAddress(req.body.to)) {
            res.status(400).send({
                status: 400,
                Error: 'Invalid Receiver address',
            });
        }
        var bytes = CryptoJS.AES.decrypt(response.privateKey, process.env.crypto_secret);
        key = bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        res.status(400).send({
            status: 400,
            Error: 'Invalid Sender',
        });
    }
    try {
        if (!['BNB', 'CTY'].includes(req.body.coin)) {
            console.log(response);
            var eth_balance = await web3.eth.getBalance(response.address);
            console.log(eth_balance);
            var balance = await web3.utils.fromWei(eth_balance, 'ether');
            console.log(balance);
        } else {
            var eth_balance = await web3BNB.eth.getBalance(response.address);
            var balance = await web3BNB.utils.fromWei(eth_balance, 'ether');
        }
        if (balance == 0) {
            return res.status(400).send({
                status: 400,
                success: false,
                Message: 'Not Enough Gas to send token',
            });
        }
        if (!['CTY', 'BNB'].includes(req.body.coin)) {
            var total_Eth = await checkBalance.getEthBalance(response.address);
            var gasOnHold = await checkBalance.contract_holding_gas(response.address);
            var gasFee = await checkBalance.gasFees();
        } else {
            var total_Eth = await checkBalance.getBNBBalance(response.address);
            var gasOnHold = await checkBalance.contract_holding_gas_BNB(response.address);
            var gasFee = await checkBalance.gasFeesBnb();
        }
        if (total_Eth - gasOnHold < gasFee) {
            return res.status(400).send({
                success: false,
                status: 400,
                response: 'Gas is not enough for this with draw',
            });
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Something went wrong',
        });
        return;
    }
    switch (req.body.coin) {
        case 'USDC':
            console.log('USDC');
            let tokenAddress = process.env.usdc_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('usdc.json', 'utf-8'));
            var instance = new web3.eth.Contract(abiArray, tokenAddress);

            try {
                var amount = await checkBalance.contract_holding_amount(response.address, 'USDC');
                await web3.eth.accounts.wallet.add(key);
                var _amount = await web3.utils.toWei(req.body.amount, 'mwei');
                var user_token = await instance.methods.balanceOf(response.address).call();
                if (user_token < parseInt(_amount) + parseInt(amount)) {
                    res.status(400).send({
                        status: 400,
                        success: false,
                        Message: 'Amount Acceed balance',
                    });
                    return;
                } else {
                    var receipt = await instance.methods
                        .transfer(req.body.to, _amount)
                        .send({ from: response.address, gas: 300000 });
                    await web3.eth.accounts.wallet.clear();
                    await WithDraw.create({
                        source: req.user.address,
                        sourceCurrency: req.body.coin,
                        destCurrency: req.body.dest.currency,
                        action: req.body.paymentMethod,
                        sourceAmount: req.body.amount,
                        dest: req.body.dest,
                        status: 'INITIATED',
                        hash: receipt.transactionHash,
                    });
                    return res.status(200).send({
                        status: 200,
                        success: true,
                        receipt: receipt,
                    });
                }
            } catch (e) {
                conxole.log(e);
                res.status(400).send({
                    status: 400,
                    success: false,
                    Message: 'Insufficient Fund!',
                });
            }

        case 'USDT':
            console.log('USDT');
            let tokenAddress1 = process.env.usdt_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('usdt.json', 'utf-8'));
            var instance = new web3.eth.Contract(abiArray, tokenAddress1);

            try {
                var amount = await checkBalance.contract_holding_amount(response.address, 'USDT');
                var _amount = await web3.utils.toWei(req.body.amount, 'mwei');
                var user_token = await instance.methods.balanceOf(response.address).call();
                if (user_token < parseInt(_amount) + parseInt(amount)) {
                    return res.status(400).send({
                        status: 400,
                        success: false,
                        Message: 'Amount Acceed balance',
                    });
                } else {
                    await web3.eth.accounts.wallet.add(key);
                    var receipt = await instance.methods
                        .transfer(req.body.to, _amount)
                        .send({ from: response.address, gas: 300000 });
                    await web3.eth.accounts.wallet.clear();
                    await WithDraw.create({
                        source: req.user.address,
                        sourceCurrency: req.body.coin,
                        destCurrency: req.body.dest.currency,
                        action: req.body.paymentMethod,
                        sourceAmount: req.body.amount,
                        dest: req.body.dest,
                        status: 'INITIATED',
                        hash: receipt.transactionHash,
                    });
                    return res.status(200).send({
                        status: 200,
                        success: true,
                        receipt: receipt,
                    });
                }
            } catch (e) {
                return res.status(400).send({
                    Status: 400,
                    success: false,
                    Message: 'Insufficient Fund!',
                });
            }

        case 'BUSD':
            console.log('BUSD');
            let tokenAddress4 = process.env.busd_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
            var instance = new web3Busd.eth.Contract(abiArray, tokenAddress4);

            try {
                var amount = await checkBalance.contract_holding_amount(response.address, 'BUSD');
                var _amount = await web3Busd.utils.toWei(req.body.amount, 'ether');
                var user_token = await instance.methods.balanceOf(response.address).call();
                if (user_token < parseInt(_amount) + parseInt(amount)) {
                    return res.status(400).send({
                        status: 400,
                        success: false,
                        Message: 'Amount Acceed balance',
                    });
                } else {
                    await web3Busd.eth.accounts.wallet.add(key);
                    var receipt = await instance.methods
                        .transfer(req.body.to, _amount)
                        .send({ from: response.address, gas: 300000 });
                    await web3Busd.eth.accounts.wallet.clear();
                    await WithDraw.create({
                        source: req.user.address,
                        sourceCurrency: req.body.coin,
                        destCurrency: req.body.dest.currency,
                        action: req.body.paymentMethod,
                        sourceAmount: req.body.amount,
                        dest: req.body.dest,
                        status: 'INITIATED',
                        hash: receipt.transactionHash,
                    });
                    return res.status(200).send({
                        status: 200,
                        success: true,
                        receipt: receipt,
                    });
                }
            } catch (e) {
                return res.status(400).send({
                    Status: 400,
                    success: false,
                    Message: 'Insufficient Fund!',
                });
            }
        case 'PAX':
            console.log('PAX');
            let tokenAddress2 = process.env.pax_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('usdt.json', 'utf-8'));
            var instance = new web3.eth.Contract(abiArray, tokenAddress2);
            try {
                var amount = await checkBalance.contract_holding_amount(response.address, 'PAX');
                var _amount = await web3.utils.toWei(req.body.amount, 'ether');
                var user_token = await instance.methods.balanceOf(response.address).call();
                if (user_token < parseInt(_amount) + parseInt(amount)) {
                    res.status(400).send({
                        status: 400,
                        success: false,
                        Message: 'Amount Acceed balance',
                    });
                    return;
                }
                await web3.eth.accounts.wallet.add(key);
                console.log(req.body.to);
                var receipt = await instance.methods
                    .transfer(req.body.to, _amount)
                    .send({ from: response.address, gas: 300000 });
                await web3.eth.accounts.wallet.clear();
                await WithDraw.create({
                    source: req.user.address,
                    sourceCurrency: req.body.coin,
                    destCurrency: req.body.dest.currency,
                    action: req.body.paymentMethod,
                    sourceAmount: req.body.amount,
                    dest: req.body.dest,
                    status: 'INITIATED',
                    hash: receipt.transactionHash,
                });
                res.status(200).send({
                    status: 200,
                    success: true,
                    receipt: receipt,
                });
                return;
            } catch (e) {
                console.log(e);
                res.status(400).send({
                    Status: 400,
                    success: false,
                    Message: 'Insufficient Fund!',
                });
                return;
            }
        case 'CTY':
            console.log('CTY');
            let tokenAddress_cty = process.env.cty_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
            var instance = new web3BNB.eth.Contract(abiArray, tokenAddress_cty);
            try {
                var amount = await checkBalance.contract_holding_amount(response.address, 'CTY');
                var _amount = await web3BNB.utils.toWei(req.body.amount, 'ether');
                var user_token = await instance.methods.balanceOf(response.address).call();
                if (user_token < parseInt(_amount) + parseInt(amount)) {
                    res.status(400).send({
                        status: 400,
                        success: false,
                        Message: 'Amount Acceed balance',
                    });
                    return;
                }
                await web3BNB.eth.accounts.wallet.add(key);
                console.log(req.body.to);
                var receipt = await instance.methods
                    .transfer(req.body.to, _amount)
                    .send({ from: response.address, gas: 300000 });
                await web3BNB.eth.accounts.wallet.clear();
                await WithDraw.create({
                    source: req.user.address,
                    sourceCurrency: req.body.coin,
                    destCurrency: req.body.dest.currency,
                    action: req.body.paymentMethod,
                    sourceAmount: req.body.amount,
                    dest: req.body.dest,
                    status: 'INITIATED',
                    hash: receipt.transactionHash,
                });
                return res.status(200).send({
                    status: 200,
                    success: true,
                    receipt: receipt,
                });
            } catch (e) {
                return res.status(400).send({
                    Status: 400,
                    success: false,
                    Message: 'Insufficient Fund!',
                });
            }
        case 'ETH':
            console.log(total_Eth, gasOnHold, Number(req.body.amount));
            if (total_Eth - gasOnHold < Number(req.body.amount)) {
                return res.status(400).send({
                    Status: 400,
                    success: false,
                    Message: 'Insufficient Fund!',
                });
            }
            const gasLim = 3000000;
            const value = await web3.utils.toWei(req.body.amount, 'ether');
            try {
                console.log(key);
                await web3.eth.accounts.wallet.add(key);
                const createTransaction = await web3.eth.accounts.signTransaction(
                    {
                        from: response.address,
                        to: req.body.to,
                        value: value,
                        gas: `${gasLim}`,
                    },
                    key
                );
                const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
                await web3.eth.accounts.wallet.clear();
                await WithDraw.create({
                    source: req.user.address,
                    sourceCurrency: req.body.coin,
                    destCurrency: req.body.dest.currency,
                    action: req.body.paymentMethod,
                    sourceAmount: req.body.amount,
                    dest: req.body.dest,
                    status: 'INITIATED',
                    hash: createTransaction.transactionHash,
                });
                return res.status(200).send({
                    status: 200,
                    success: true,
                    receipt: createReceipt,
                });
            } catch (e) {
                console.log(e);
                return res.status(400).send({
                    Status: 400,
                    success: false,
                    Message: 'Transaction Failed',
                });
            }
        case 'BNB':
            if (total_Eth - gasOnHold < Number(req.body.amount)) {
                return res.status(400).send({
                    Status: 400,
                    success: false,
                    Message: 'Insufficient Fund!',
                });
            }
            const gasLimit = 3000000;
            const amt = await web3BNB.utils.toWei(req.body.amount, 'ether');
            try {
                console.log(key);
                await web3BNB.eth.accounts.wallet.add(key);
                const createTransaction = await web3BNB.eth.accounts.signTransaction(
                    {
                        from: response.address,
                        to: req.body.to,
                        value: amt,
                        gas: `${gasLimit}`,
                    },
                    key
                );
                const createReceipt = await web3BNB.eth.sendSignedTransaction(
                    createTransaction.rawTransaction
                );
                await web3BNB.eth.accounts.wallet.clear();
                await WithDraw.create({
                    source: req.user.address,
                    sourceCurrency: req.body.coin,
                    destCurrency: req.body.dest.currency,
                    action: req.body.paymentMethod,
                    sourceAmount: req.body.amount,
                    dest: req.body.dest,
                    status: 'INITIATED',
                    hash: createTransaction.transactionHash,
                });
                return res.status(200).send({
                    status: 200,
                    success: true,
                    receipt: createReceipt,
                });
            } catch (e) {
                console.log(e);
                return res.status(400).send({
                    Status: 400,
                    success: false,
                    Message: 'Transaction Failed',
                });
            }
        default:
            return res.status(400).send({
                status: 400,
                success: false,
                Message: 'Transaction Sending failed',
            });
    }
};

var withDrawCoins = async (req, res) => {
    console.log(req.body);
    try {
        if (!req.body.amount || !req.body.coin) {
            return res.status(400).send({
                status: 400,
                Error: 'amount & coin required',
            });
        }
        if (!req.body.paymentMethod) {
            return res.status(400).send({
                status: 400,
                Error: 'paymentMethod is required',
            });
        }
        const recepit = await send_cty_to_admin(req.user);
        console.log(recepit);
        if (!recepit.status) {
            return res.status(400).send({
                status: 400,
                success: false,
                response: 'Gas fees transfer failed',
            });
        }
        if (req.body.paymentMethod === 'BTC_transfer') {
            if (!req.body.address) {
                return res.status(400).send({
                    status: 400,
                    Error: 'address is required',
                });
            }
            await User.findByIdAndUpdate(req.user._id, { BTC_address: req.body.address }, { new: true });
            req.body.to = process.env.BTC_WALLET;
            req.body.dest = { address: req.body.address, currency: 'BTC' };
            await withDraw(req, res);
        } else if (req.body.paymentMethod == 'BANK_transfer') {
            const {
                routingNumber,
                accountType,
                accountNumber,
                currency,
                firstNameOnAccount,
                lastNameOnAccount,
                paymentMethodType,
                country,
                cpfCnpj,
                beneficiaryAddress2,
                beneficiaryCity,
                beneficiaryPhoneNumber,
                clabe,
                beneficiaryName,
                swiftBic,
                bankCode,
                branchCode,
                accountHolderPhoneNumber,
                bsbNumber,
                beneficiaryType,
                beneficiaryAddress,
                chargeablePM,
            } = req.body;
            let destinationCurrency = currency;
            let body = {
                dest: {
                    paymentMethodType,
                    country,
                    currency,
                    accountNumber,
                    accountType,
                    beneficiaryAddress,
                    beneficiaryAddress2,
                    beneficiaryCity,
                    beneficiaryName,
                    beneficiaryPhoneNumber,
                },
            };
            if (country === 'MX') {
                if (!clabe || !firstNameOnAccount || !lastNameOnAccount) {
                    return res.status(400).send({
                        status: 400,
                        Error: 'Clabe Not Found',
                    });
                }
                body = {
                    dest: {
                        ...body.dest,
                        clabe,
                        firstNameOnAccount,
                        lastNameOnAccount,
                    },
                };
            } else if (country === 'UK') {
                if (!beneficiaryName || !swiftBic || !firstNameOnAccount || !lastNameOnAccount) {
                    return res.status(400).send({
                        status: 400,
                        Error: 'beneficiaryName or swiftBic Not Found',
                    });
                }
                body = {
                    dest: {
                        ...body.dest,
                        beneficiaryName,
                        swiftBic,
                        firstNameOnAccount,
                        lastNameOnAccount,
                    },
                };
            } else if (country === 'BR') {
                if (
                    !bankCode ||
                    !branchCode ||
                    !accountNumber ||
                    !cpfCnpj ||
                    !accountHolderPhoneNumber ||
                    !firstNameOnAccount ||
                    !lastNameOnAccount
                ) {
                    return res.status(400).send({
                        status: 400,
                        Error: 'bankCode, branchCode, nameOnAccount, accountNumber, accountHolderPhoneNumber or cpfCnpj is Missing',
                    });
                }
                let nameOnAccount = firstNameOnAccount + lastNameOnAccount;
                body = {
                    dest: {
                        ...body.dest,
                        bankCode,
                        branchCode,
                        nameOnAccount,
                        accountNumber,
                        accountHolderPhoneNumber,
                    },
                };
            } else if (country === 'US') {
                if (!routingNumber || !firstNameOnAccount || !lastNameOnAccount) {
                    return res.status(400).send({
                        status: 400,
                        Error: 'routingNumber, firstNameOnAccount or lastNameOnAccount Not Found',
                    });
                }
                body = {
                    dest: {
                        ...body.dest,
                        firstNameOnAccount,
                        lastNameOnAccount,
                        routingNumber,
                    },
                };
            } else {
                if (!beneficiaryType || !beneficiaryName || !beneficiaryAddress || !swiftBic) {
                    return res.status(400).send({
                        status: 400,
                        Error: 'Missing prameters in Else case',
                    });
                }
                body = {
                    dest: {
                        ...body.dest,
                        swiftBic,
                        chargeablePM,
                        beneficiaryType,
                        beneficiaryName,
                        beneficiaryAddress,
                    },
                };
            }
            await User.findByIdAndUpdate(req.user._id, { BANK_account: body.dest }, { new: true });
            //await WithDraw.create({source:req.user.address,destination:BANK_account,status:'INITIATED',hash)
            req.body.to = process.env.USD_WALLET;
            req.body.dest = body.dest;
            await withDraw(req, res);
        } else {
            return res.status(400).send({
                status: 400,
                Error: 'Enter valid paymentmethod',
            });
        }
    } catch (e) {
        console.log(e);
        return res.status(400).send({
            status: 400,
            Error: 'Something Went Wrong',
        });
    }
};

module.exports = {
    withDraw,
    withDrawCoins,
    getPayouts,
    getOnePayout,
};
