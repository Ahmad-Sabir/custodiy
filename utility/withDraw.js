const axios = require('axios');
const withdrawcheck = async (req, res, next) => {
	const URLBTC = `${process.env.WALLETS_API_V2}/${process.env.BTC_WALLET_ID}`;
	const URLUSD = `${process.env.WALLETS_API_V2}/${process.env.USD_WALLET_ID}`;
	let token = `Bearer ${process.env.MAIN_NET_TOKEN}`;
	let data;
	if (req.body.paymentMethod === 'BTC_transfer') {
		data = await axios.get(URLBTC, {
			headers: { Authorization: token },
		});
		console.log(data);
	} else if (req.body.paymentMethod === 'BANK_transfer') {
		data = await axios.get(URLUSD, {
			headers: { Authorization: token },
		});
	}
};
