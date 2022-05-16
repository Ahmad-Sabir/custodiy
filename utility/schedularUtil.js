const Web3 = require('web3');
const fs = require('fs');
const User = require('../models/User');
const Contracts = require('../models/TransactionModel');
const update_received_token = require('../utility/update_received_token');
const update_send_token = require('../utility/update_send_token');
var CryptoJS = require('crypto-js');
const web3 = new Web3(process.env.ETH_LINK);
const web3Busd = new Web3(process.env.ETH_LINK);
const web3BNB = new Web3(process.env.BNB_LINK);

module.exports = async (contract, _user) => {
    let key;
    var bytes = CryptoJS.AES.decrypt(_user.privateKey, process.env.crypto_secret);
    key = bytes.toString(CryptoJS.enc.Utf8);
    switch (contract.Symbol) {
        case 'USDC':
            console.log('USDC');
            let tokenAddress = process.env.usdc_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('usdc.json', 'utf-8'));
            var instance = new web3.eth.Contract(abiArray, tokenAddress);
            try {
                var _amount = await web3.utils.toWei(contract.Amount, 'mwei');
                await web3.eth.accounts.wallet.add(key);
                var receipt = await instance.methods
                    .transfer(contract.Beneficiary, _amount)
                    .send({ from: contract.Transfer, gas: 300000 });
                let admin;
                if (receipt.status) {
                    if (Number(contract.adminFee) > 0) {
                        var _adminFee = await web3.utils.toWei(`${contract.adminFee}`, 'mwei');
                        admin = await instance.methods
                            .transfer(process.env.ADMIN_ADDRESS, _adminFee)
                            .send({ from: contract.Transfer, gas: 300000 });
                    }
                }
                await web3.eth.accounts.wallet.clear();
                try {
                    await update_send_token.updateUser(
                        'send_USDC',
                        Number(contract.Amount) + Number(contract.adminFee),
                        contract.Transfer
                    );
                    await update_received_token.updateUser(
                        'received_USDC',
                        contract.Amount,
                        contract.Beneficiary
                    );
                } catch (e) {
                    let Error = 'Updation of Database Failed';
                    return Error;
                }
                return [receipt, admin];
            } catch (e) {
                let Message = 'Insufficient Fund!';
                return Message;
            }

        case 'USDT':
            console.log('USDT');
            let usdt_tokenAddress = process.env.usdt_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('usdt.json', 'utf-8'));
            var instance = new web3.eth.Contract(abiArray, usdt_tokenAddress);
            try {
                var _amount = await web3.utils.toWei(contract.Amount, 'mwei');
                console.log(_amount);
                await web3.eth.accounts.wallet.add(key);
                var receipt = await instance.methods
                    .transfer(contract.Beneficiary, _amount)
                    .send({ from: contract.Transfer, gas: 300000 });
                console.log(receipt);
                let admin;
                if (receipt.status) {
                    if (Number(contract.adminFee) > 0) {
                        var _adminFee = await web3.utils.toWei(`${contract.adminFee}`, 'mwei');
                        admin = await instance.methods
                            .transfer(process.env.ADMIN_ADDRESS, _adminFee)
                            .send({ from: contract.Transfer, gas: 300000 });
                    }
                }
                await web3.eth.accounts.wallet.clear();
                try {
                    await update_send_token.updateUser(
                        'send_USDT',
                        Number(contract.Amount) + Number(contract.adminFee),
                        contract.Transfer
                    );
                    await update_received_token.updateUser(
                        'received_USDT',
                        contract.Amount,
                        contract.Beneficiary
                    );
                } catch (e) {
                    let Error = 'Updation of Database Failed';
                    return Error;
                }
                console.log(receipt, admin);
                return [receipt, admin];
            } catch (e) {
                let Message = 'Insufficient Fund!';
                return Message;
            }
        case 'BUSD':
            console.log('BUSD');
            let busd_tokenAddress = process.env.busd_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
            var instance = new web3Busd.eth.Contract(abiArray, busd_tokenAddress);
            try {
                var _amount = await web3Busd.utils.toWei(contract.Amount, 'ether');
                await web3Busd.eth.accounts.wallet.add(key);
                var receipt = await instance.methods
                    .transfer(contract.Beneficiary, _amount)
                    .send({ from: contract.Transfer, gas: 300000 });
                //console.log(receipt)
                let admin;
                if (receipt.status) {
                    if (Number(contract.adminFee) > 0) {
                        var _adminFee = await web3Busd.utils.toWei(`${contract.adminFee}`, 'ether');
                        admin = await instance.methods
                            .transfer(process.env.ADMIN_ADDRESS, _adminFee)
                            .send({ from: contract.Transfer, gas: 300000 });
                    }
                }
                await web3Busd.eth.accounts.wallet.clear();
                try {
                    await update_send_token.updateUser(
                        'send_BUSD',
                        Number(contract.Amount) + Number(contract.adminFee),
                        contract.Transfer
                    );
                    await update_received_token.updateUser(
                        'received_BUSD',
                        contract.Amount,
                        contract.Beneficiary
                    );
                } catch (e) {
                    console.log(e);
                    let Error = 'Updation of Database Failed';
                    return Error;
                }
                console.log(receipt);
                return [receipt, admin];
            } catch (e) {
                let Message = 'Insufficient Fund!';
                return Message;
            }
        case 'CTY':
            console.log('CTY');
            let cty_tokenAddress = process.env.cty_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
            var instance = new web3BNB.eth.Contract(abiArray, cty_tokenAddress);
            try {
                var _amount = await web3BNB.utils.toWei(contract.Amount, 'ether');
                await web3BNB.eth.accounts.wallet.add(key);
                var receipt = await instance.methods
                    .transfer(contract.Beneficiary, _amount)
                    .send({ from: contract.Transfer, gas: 300000 });
                //console.log(receipt)
                let admin;
                if (receipt.status) {
                    if (Number(contract.adminFee) > 0) {
                        var _adminFee = await web3BNB.utils.toWei(`${contract.adminFee}`, 'ether');
                        admin = await instance.methods
                            .transfer(process.env.ADMIN_ADDRESS, _adminFee)
                            .send({ from: contract.Transfer, gas: 300000 });
                    }
                }
                await web3BNB.eth.accounts.wallet.clear();
                try {
                    await update_send_token.updateUser(
                        'send_CTY',
                        Number(contract.Amount) + Number(contract.adminFee),
                        contract.Transfer
                    );
                    await update_received_token.updateUser(
                        'received_CTY',
                        contract.Amount,
                        contract.Beneficiary
                    );
                } catch (e) {
                    console.log(e);
                    let Error = 'Updation of Database Failed';
                    return Error;
                }
                console.log(receipt);
                return [receipt, admin];
            } catch (e) {
                let Message = 'Insufficient Fund!';
                return Message;
            }
        case 'BNB':
            console.log('BNB');
            try {
                const gasLim = 3000000;
                var _amount = await web3BNB.utils.toWei(contract.Amount, 'ether');
                await web3BNB.eth.accounts.wallet.add(key);
                const createTransaction = await web3BNB.eth.accounts.signTransaction(
                    {
                        from: contract.Transfer,
                        to: contract.Beneficiary,
                        value: _amount,
                        gas: `${gasLim}`,
                    },
                    key
                );
                const createReceipt = await web3BNB.eth.sendSignedTransaction(
                    createTransaction.rawTransaction
                );
                let admin;
                if (createReceipt.status) {
                    if (Number(contract.adminFee) > 0) {
                        var _adminFee = await web3BNB.utils.toWei(`${contract.adminFee}`, 'ether');
                        const createTransaction = await web3BNB.eth.accounts.signTransaction(
                            {
                                from: contract.Transfer,
                                to: contract.Beneficiary,
                                value: _adminFee,
                                gas: 300000,
                            },
                            key
                        );
                        admin = await web3BNB.eth.sendSignedTransaction(createTransaction.rawTransaction);
                    }
                }
                await web3BNB.eth.accounts.wallet.clear();
                try {
                    await update_send_token.updateUser(
                        'send_BNB',
                        Number(contract.Amount) + Number(contract.adminFee),
                        contract.Transfer
                    );
                    await update_received_token.updateUser(
                        'received_BNB',
                        contract.Amount,
                        contract.Beneficiary
                    );
                } catch (e) {
                    console.log(e);
                    let Error = 'Updation of Database Failed';
                    return Error;
                }
                console.log(createReceipt);
                return [createReceipt, admin];
            } catch (e) {
                let Message = 'Insufficient Fund!';
                return Message;
            }
        case 'ETH':
            console.log('ETH');
            try {
                const gasLim = 3000000;
                var _amount = await web3.utils.toWei(contract.Amount, 'ether');
                await web3.eth.accounts.wallet.add(key);
                const createTransaction = await web3.eth.accounts.signTransaction(
                    {
                        from: contract.Transfer,
                        to: contract.Beneficiary,
                        value: _amount,
                        gas: `${gasLim}`,
                    },
                    key
                );
                const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
                let admin;
                if (createReceipt.status) {
                    if (Number(contract.adminFee) > 0) {
                        var _adminFee = await web3.utils.toWei(`${contract.adminFee}`, 'ether');
                        const createTransaction = await web3Busd.eth.accounts.signTransaction(
                            {
                                from: contract.Transfer,
                                to: contract.Beneficiary,
                                value: _adminFee,
                                gas: 300000,
                            },
                            key
                        );
                        admin = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
                    }
                }
                await web3.eth.accounts.wallet.clear();
                try {
                    await update_send_token.updateUser(
                        'send_ETH',
                        Number(contract.Amount) + Number(contract.adminFee),
                        contract.Transfer
                    );
                    await update_received_token.updateUser(
                        'received_ETH',
                        contract.Amount,
                        contract.Beneficiary
                    );
                } catch (e) {
                    console.log(e);
                    let Error = 'Updation of Database Failed';
                    return Error;
                }
                console.log(createReceipt);
                return [createReceipt, admin];
            } catch (e) {
                let Message = 'Insufficient Fund!';
                return Message;
            }
        case 'PAX':
            console.log('PAX');
            let pax_tokenAddress = process.env.pax_contract_address;
            var abiArray = JSON.parse(fs.readFileSync('usdt.json', 'utf-8'));
            var instance = new web3.eth.Contract(abiArray, pax_tokenAddress);
            try {
                var _amount = await web3.utils.toWei(contract.Amount, 'ether');
                await web3.eth.accounts.wallet.add(key);
                var receipt = await instance.methods
                    .transfer(contract.Beneficiary, _amount)
                    .send({ from: contract.Transfer, gas: 300000 });
                let admin;
                if (receipt.status) {
                    if (Number(contract.adminFee) > 0) {
                        var _adminFee = await web3.utils.toWei(`${contract.adminFee}`, 'ether');
                        admin = await instance.methods
                            .transfer(process.env.ADMIN_ADDRESS, _adminFee)
                            .send({ from: contract.Transfer, gas: 300000 });
                    }
                }
                await web3.eth.accounts.wallet.clear();
                try {
                    await update_send_token.updateUser(
                        'send_PAX',
                        Number(contract.Amount) + Number(contract.adminFee),
                        contract.Transfer
                    );
                    await update_received_token.updateUser(
                        'received_PAX',
                        contract.Amount,
                        contract.Beneficiary
                    );
                } catch (e) {
                    let Error = 'Updation of Database Failed';
                    return Error;
                }

                return [receipt, admin];
            } catch (e) {
                let Message = 'Insufficient Fund!';
                return Message;
            }

        default:
            let Message = 'Unknown Error';
            return Message;
    }
};
