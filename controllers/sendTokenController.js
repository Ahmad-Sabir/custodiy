const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const fs = require('fs');
const User = require('../models/User');
const update_received_token = require('../utility/update_received_token');
const update_send_token = require('../utility/update_send_token');
const checkBalance = require('../utility/checkBalance');
const Transaction_Status = require('../utility/Update_Transaction_status');
var CryptoJS = require('crypto-js');
var jwt = require('jsonwebtoken');
const web3 = new Web3(process.env.ETH_LINK);
const web3Busd = new Web3(process.env.ETH_LINK);
const web3BNB = new Web3(process.env.BNB_LINK);
console.log(process.env.BNB_LINK);

var sendToken = async (req, res) => {
	let value = req.user;
	const d = new Date();
	let date =
		(d.getMonth() > 8 ? d.getMonth() + 1 : '0' + (d.getMonth() + 1)) +
		'/' +
		(d.getDate() > 9 ? d.getDate() : '0' + d.getDate()) +
		'/' +
		d.getFullYear();

	let response;
	let key;
	try {
		var user = await User.find({ email: value.email });
		if (user.length == 0)
			res.status(400).send({
				status: 400,
				Error: 'Invalid User',
			});
		const [rs] = user;
		response = rs;
		if (!web3.utils.isAddress(req.body.receiver)) {
			res.status(400).send({
				status: 400,
				Error: 'Invalid Receiver address',
			});
		}
		var bytes = CryptoJS.AES.decrypt(
			response.privateKey,
			process.env.crypto_secret
		);
		key = bytes.toString(CryptoJS.enc.Utf8);
	} catch (e) {
		res.status(400).send({
			status: 400,
			Error: 'Invalid Sender',
		});
	}
	try {
		if (!['BUSD', 'BNB'].includes(req.body.coin)) {
			var eth_balance = await web3.eth.getBalance(response.address);
			var balance = await web3.utils.fromWei(eth_balance, 'ether');
		} else if (req.body.coin == 'BUSD') {
			var eth_balance = await web3Busd.eth.getBalance(response.address);
			var balance = await web3Busd.utils.fromWei(eth_balance, 'ether');
		} else if (req.body.coin == 'BNB') {
			var eth_balance = await web3BNB.eth.getBalance(response.address);
			var balance = await web3BNB.utils.fromWei(eth_balance, 'ether');
		}
		if (Number(req.body.amount) <= 0) {
			return res.status(400).send({
				status: 400,
				success: false,
				Error: 'contract amount can`t be 0',
			});
		}
		if (balance == 0) {
			return res.status(400).send({
				status: 400,
				success: false,
				Error: 'Not Enough Gas to send token',
			});
		}
		// if (!['BUSD', 'BNB'].includes(req.body.coin)) {
		if (!['BNB'].includes(req.body.coin)) {
			var total_Eth = await checkBalance.getEthBalance(response.address);
			var gasOnHold = await checkBalance.contract_holding_gas(response.address);
			var gasFee = await checkBalance.gasFees();
		} else {
			var total_Eth = await checkBalance.getBNBBalance(response.address);
			var gasOnHold = await checkBalance.contract_holding_gas_BNB(
				response.address
			);
			var gasFee = await checkBalance.gasFeesBnb();
		}
		if (total_Eth - gasOnHold < gasFee) {
			return res.status(400).send({
				success: false,
				status: 400,
				Error: 'Gas is not enough to create contract for schedule transaction',
			});
		}
	} catch (e) {
		return res.status(400).send({
			status: 400,
			success: false,
			Error: 'Something went wrong',
		});
	}
	switch (req.body.coin) {
		case 'ETH':
			console.log('ETH');
			try {
				var amount = await checkBalance.contract_holding_amount(
					response.address,
					'ETH'
				);
				await web3.eth.accounts.wallet.add(key);
				var _amount = await web3.utils.toWei(req.body.amount, 'ether');
				var user_token = await web3.eth.getBalance(response.address);
				console.log(user_token, parseInt(_amount), parseInt(amount));
				if (user_token < parseInt(_amount) + parseInt(amount)) {
					res.status(400).send({
						status: 400,
						success: false,
						Error: 'Insufficient Fund!',
					});
					return;
				} else {
					const createTransaction = await web3.eth.accounts.signTransaction(
						{
							from: response.address,
							to: req.body.receiver,
							value: _amount,
							gas: 300000,
						},
						key
					);
					const receipt = await web3.eth.sendSignedTransaction(
						createTransaction.rawTransaction
					);
					await web3.eth.accounts.wallet.clear();
					try {
						await update_send_token.updateUser(
							'send_ETH',
							req.body.amount,
							response.address
						);
						await update_received_token.updateUser(
							'received_ETH',
							req.body.amount,
							req.body.receiver
						);
						await Transaction_Status.Change_Transaction_status(
							response.address,
							undefined,
							req.body.receiver,
							receipt.transactionHash,
							date,
							'Completed',
							req.body.amount,
							'Direct Transaction',
							'ETH'
						);
					} catch (e) {
						res.status(200).send({
							status: 200,
							success: true,
							Error: 'Updation to Database Failed',
						});
						return;
					}
					res.status(200).send({
						status: 200,
						success: true,
						receipt: receipt,
					});
					return;
				}
			} catch (e) {
				res.status(400).send({
					status: 400,
					success: false,
					Message: 'Insufficient Fund!',
				});
			}
		case 'BNB':
			console.log('BNB');
			try {
				var amount = await checkBalance.contract_holding_amount(
					response.address,
					'BNB'
				);
				await web3Busd.eth.accounts.wallet.add(key);
				var _amount = await web3Busd.utils.toWei(req.body.amount, 'ether');
				var user_token = await web3Busd.eth.getBalance(response.address);
				if (user_token < parseInt(_amount) + parseInt(amount)) {
					res.status(400).send({
						status: 400,
						success: false,
						Error: 'Insufficient Fund!',
					});
					return;
				} else {
					const createTransaction = await web3Busd.eth.accounts.signTransaction(
						{
							from: response.address,
							to: req.body.receiver,
							value: _amount,
							gas: 300000,
						},
						key
					);
					const receipt = await web3Busd.eth.sendSignedTransaction(
						createTransaction.rawTransaction
					);
					await web3Busd.eth.accounts.wallet.clear();
					try {
						await update_send_token.updateUser(
							'send_BNB',
							req.body.amount,
							response.address
						);
						await update_received_token.updateUser(
							'received_BNB',
							req.body.amount,
							req.body.receiver
						);
						await Transaction_Status.Change_Transaction_status(
							response.address,
							undefined,
							req.body.receiver,
							receipt.transactionHash,
							date,
							'Completed',
							req.body.amount,
							'Direct Transaction',
							'BNB'
						);
					} catch (e) {
						res.status(200).send({
							status: 200,
							success: true,
							Error: 'Updation to Database Failed',
						});
						return;
					}
					res.status(200).send({
						status: 200,
						success: true,
						receipt: receipt,
					});
					return;
				}
			} catch (e) {
				res.status(400).send({
					status: 400,
					success: false,
					Error: 'Insufficient Fund!',
				});
			}
		case 'USDC':
			console.log('USDC');
			let tokenAddress = process.env.usdc_contract_address;
			var abiArray = JSON.parse(fs.readFileSync('usdc.json', 'utf-8'));
			var instance = new web3.eth.Contract(abiArray, tokenAddress);

			try {
				var amount = await checkBalance.contract_holding_amount(
					response.address,
					'USDC'
				);
				await web3.eth.accounts.wallet.add(key);
				var _amount = await web3.utils.toWei(req.body.amount, 'mwei');
				var user_token = await instance.methods
					.balanceOf(response.address)
					.call();
				console.log(user_token, parseInt(_amount), parseInt(amount));
				if (user_token < parseInt(_amount) + parseInt(amount)) {
					res.status(400).send({
						status: 400,
						success: false,
						Error: 'Insufficient Fund!',
					});
					return;
				} else {
					var receipt = await instance.methods
						.transfer(req.body.receiver, _amount)
						.send({ from: response.address, gas: 300000 });
					await web3.eth.accounts.wallet.clear();
					try {
						await update_send_token.updateUser(
							'send_USDC',
							req.body.amount,
							response.address
						);
						await update_received_token.updateUser(
							'received_USDC',
							req.body.amount,
							req.body.receiver
						);
						await Transaction_Status.Change_Transaction_status(
							response.address,
							undefined,
							req.body.receiver,
							receipt.transactionHash,
							date,
							'Completed',
							req.body.amount,
							'Direct Transaction',
							'USDC'
						);
					} catch (e) {
						res.status(200).send({
							status: 200,
							success: true,
							Error: 'Updation to Database Failed',
						});
						return;
					}
					res.status(200).send({
						status: 200,
						success: true,
						receipt: receipt,
					});
					return;
				}
			} catch (e) {
				res.status(400).send({
					status: 400,
					success: false,
					Error: 'Insufficient Fund!',
				});
			}

		case 'USDT':
			console.log('USDT');
			let tokenAddress1 = process.env.usdt_contract_address;
			var abiArray = JSON.parse(fs.readFileSync('usdt.json', 'utf-8'));
			var instance = new web3.eth.Contract(abiArray, tokenAddress1);

			try {
				var amount = await checkBalance.contract_holding_amount(
					response.address,
					'USDT'
				);
				var _amount = await web3.utils.toWei(req.body.amount, 'mwei');
				var user_token = await instance.methods
					.balanceOf(response.address)
					.call();
				console.log(user_token, parseInt(_amount), parseInt(amount));
				if (user_token < parseInt(_amount) + parseInt(amount)) {
					return res.status(400).send({
						status: 400,
						success: false,
						Error: 'Insufficient Fund!',
					});
				} else {
					await web3.eth.accounts.wallet.add(key);
					var receipt = await instance.methods
						.transfer(req.body.receiver, _amount)
						.send({ from: response.address, gas: 300000 });
					await web3.eth.accounts.wallet.clear();
					try {
						await update_send_token.updateUser(
							'send_USDT',
							req.body.amount,
							response.address
						);
						await update_received_token.updateUser(
							'received_USDT',
							req.body.amount,
							req.body.receiver
						);
						await Transaction_Status.Change_Transaction_status(
							response.address,
							undefined,
							req.body.receiver,
							receipt.transactionHash,
							date,
							'Completed',
							req.body.amount,
							'Direct Transaction',
							'USDT'
						);
					} catch (e) {
						return res.status(200).send({
							status: 200,
							success: true,
							Error: 'Updation to Database Failed',
						});
					}
					return res.status(200).send({
						status: 200,
						success: true,
						receipt: receipt,
					});
				}
			} catch (e) {
				console.log(e);
				return res.status(400).send({
					Status: 400,
					success: false,
					Error: 'Insufficient Fund!',
				});
			}

		case 'BUSD':
			console.log('BUSD');
			let tokenAddress4 = process.env.busd_contract_address;
			var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
			var instance = new web3Busd.eth.Contract(abiArray, tokenAddress4);

			try {
				var amount = await checkBalance.contract_holding_amount(
					response.address,
					'BUSD'
				);
				var _amount = await web3Busd.utils.toWei(req.body.amount, 'ether');
				var user_token = await instance.methods
					.balanceOf(response.address)
					.call();
				if (user_token < parseInt(_amount) + parseInt(amount)) {
					res.status(400).send({
						status: 400,
						success: false,
						Error: 'Insufficient Fund!',
					});
					return;
				} else {
					await web3Busd.eth.accounts.wallet.add(key);
					var receipt = await instance.methods
						.transfer(req.body.receiver, _amount)
						.send({ from: response.address, gas: 300000 });
					await web3Busd.eth.accounts.wallet.clear();
					try {
						await update_send_token.updateUser(
							'send_BUSD',
							req.body.amount,
							response.address
						);
						await update_received_token.updateUser(
							'received_BUSD',
							req.body.amount,
							req.body.receiver
						);
						await Transaction_Status.Change_Transaction_status(
							response.address,
							undefined,
							req.body.receiver,
							receipt.transactionHash,
							date,
							'Completed',
							req.body.amount,
							'Direct Transaction',
							'BUSD'
						);
					} catch (e) {
						res.status(200).send({
							status: 200,
							success: true,
							Error: 'Updation to Database Failed',
						});
						return;
					}
					res.status(200).send({
						status: 200,
						success: true,
						receipt: receipt,
					});
					return;
				}
			} catch (e) {
				return res.status(400).send({
					Status: 400,
					success: false,
					Error: 'Insufficient Fund!',
				});
			}
		case 'CTY':
			console.log('CTY');
			let tokenAddress5 = process.env.cty_contract_address;
			var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
			var instance = new web3BNB.eth.Contract(abiArray, tokenAddress5);

			try {
				var amount = await checkBalance.contract_holding_amount(
					response.address,
					'CTY'
				);
				var _amount = await web3BNB.utils.toWei(req.body.amount, 'ether');
				var user_token = await instance.methods
					.balanceOf(response.address)
					.call();
				if (user_token < parseInt(_amount) + parseInt(amount)) {
					res.status(400).send({
						status: 400,
						success: false,
						Error: 'Insufficient Fund!',
					});
					return;
				} else {
					await web3BNB.eth.accounts.wallet.add(key);
					var receipt = await instance.methods
						.transfer(req.body.receiver, _amount)
						.send({ from: response.address, gas: 300000 });
					await web3BNB.eth.accounts.wallet.clear();
					try {
						await update_send_token.updateUser(
							'send_CTY',
							req.body.amount,
							response.address
						);
						await update_received_token.updateUser(
							'received_CTY',
							req.body.amount,
							req.body.receiver
						);
						await Transaction_Status.Change_Transaction_status(
							response.address,
							undefined,
							req.body.receiver,
							receipt.transactionHash,
							date,
							'Completed',
							req.body.amount,
							'Direct Transaction',
							'CTY'
						);
					} catch (e) {
						res.status(200).send({
							status: 200,
							success: true,
							Error: 'Updation to Database Failed',
						});
						return;
					}
					res.status(200).send({
						status: 200,
						success: true,
						receipt: receipt,
					});
					return;
				}
			} catch (e) {
				return res.status(400).send({
					Status: 400,
					success: false,
					Error: 'Insufficient Fund!',
				});
			}
		case 'PAX':
			console.log('PAX');
			let tokenAddress2 = process.env.pax_contract_address;
			var abiArray = JSON.parse(fs.readFileSync('usdt.json', 'utf-8'));
			var instance = new web3.eth.Contract(abiArray, tokenAddress2);
			try {
				var amount = await checkBalance.contract_holding_amount(
					response.address,
					'PAX'
				);
				var _amount = await web3.utils.toWei(req.body.amount, 'ether');
				var user_token = await instance.methods
					.balanceOf(response.address)
					.call();
				if (user_token < parseInt(_amount) + parseInt(amount)) {
					res.status(400).send({
						status: 400,
						success: false,
						Error: 'Insufficient Fund!',
					});
					return;
				}
				await web3.eth.accounts.wallet.add(key);
				var receipt = await instance.methods
					.transfer(req.body.receiver, _amount)
					.send({ from: response.address, gas: 300000 });
				await web3.eth.accounts.wallet.clear();
				try {
					await update_send_token.updateUser(
						'send_PAX',
						req.body.amount,
						response.address
					);
					await update_received_token.updateUser(
						'received_PAX',
						req.body.amount,
						req.body.receiver
					);
					await Transaction_Status.Change_Transaction_status(
						response.address,
						undefined,
						req.body.receiver,
						receipt.transactionHash,
						date,
						'Completed',
						req.body.amount,
						'Direct Transaction',
						'PAX'
					);
				} catch (e) {
					res.status(200).send({
						status: 200,
						success: true,
						Error: 'Updation to Database Failed',
					});
					return;
				}
				res.status(200).send({
					status: 200,
					success: true,
					receipt: receipt,
				});
				return;
			} catch (e) {
				res.status(400).send({
					Status: 400,
					success: false,
					Error: 'Insufficient Fund!',
				});
				return;
			}

		default:
			res.status(500).send({
				Status: 500,
				success: false,
				Error: 'Transaction Sending failed',
			});
			return;
	}
};

const send_cty_to_admin = async (user) => {
	var bytes = CryptoJS.AES.decrypt(user.privateKey, process.env.crypto_secret);
	var key = bytes.toString(CryptoJS.enc.Utf8);
	let tokenAddress5 = process.env.cty_contract_address;
	var abiArray = JSON.parse(fs.readFileSync('busd.json', 'utf-8'));
	var instance = new web3BNB.eth.Contract(abiArray, tokenAddress5);
	var _amount = await web3BNB.utils.toWei(process.env.cty_fee, 'ether');
	var user_token = await instance.methods.balanceOf(user.address).call();
	await web3BNB.eth.accounts.wallet.add(key);
	var receipt = await instance.methods
		.transfer(process.env.ADMIN_ADDRESS, _amount)
		.send({ from: user.address, gas: 300000 });
	await web3BNB.eth.accounts.wallet.clear();
	return receipt;
};

module.exports = {
	sendToken,
	send_cty_to_admin,
};
