const axios = require('axios');
const resp = async (req, data, res) => {
	if(!['ETH', 'BUSD','PAX','USDT','USDC'].includes(req.body.coin)){
		return res.status(400).send({
			status: 400,
			success: false,
			Message: "invalid coin selected",
		});
	}
	else if(!data.availableBalances[req.body.coin]) {
		return res.status(522).send({
			status: 422,
			success: false,
			Message: "you can't withraw this time, please try after sometime",
		});
	} else if (req.body.coin === 'ETH') {
		if (data.availableBalances[req.body.coin] < 0.001) {
			return res.status(422).send({
				status: 422,
				success: false,
				Message: "you can't withraw this time, please try after sometime",
			});
		}
	} else {
		if (data.availableBalances[req.body.coin] < 1) {
			return res.status(422).send({
				status: 422,
				success: false,
				Message: "you can't withraw this time, please try after sometime",
			});
		}
	}
};
const withdrawcheck = async (req, res, next) => {
	try {
		console.log(req.body);
		const URLBTC = `${process.env.WALLETS_API_V2}/${process.env.BTC_WALLET_ID}`;
		const URLUSD = `${process.env.WALLETS_API_V2}/${process.env.USD_WALLET_ID}`;
		let token = `Bearer ${process.env.MAIN_NET_TOKEN}`;
		let response;
		if (req.body.paymentMethod === 'BTC_transfer') {
			console.log('here');
			response = await axios.get(URLBTC, {
				headers: { Authorization: token },
			});
			const { data } = response;
			await resp(req, data, res);
			return next();
		} else if (req.body.paymentMethod === 'BANK_transfer') {
			console.log('here');
			response = await axios.get(URLUSD, {
				headers: { Authorization: token },
			});
			const { data } = response;
			await resp(req, data, res);
			return next();
		}
	} catch (e) {
		console.log(e);
		return res.status(500).send({
			status: 500,
			success: false,
			Message: 'something went wrong',
		});
	}
};

module.exports = withdrawcheck;
