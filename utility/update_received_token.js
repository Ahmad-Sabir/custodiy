const User = require('../models/User');

var updateUser = async (token, value, address) => {
    var user = await User.find({ address: address });

    if (user.length == 0) {
        return;
    }
    const [response] = user;
    switch (token) {
        case 'received_USDC':
            var usdc = Number(response.received_USDC) + Number(value);
            let update_usdc = { received_USDC: usdc };
            let doc1 = await User.findOneAndUpdate({ address: address }, update_usdc, {
                new: true,
            });

            break;
        case 'received_USDT':
            var usdt = Number(response.received_USDT) + Number(value);
            let update_usdt = { received_USDT: usdt };
            let doc4 = await User.findOneAndUpdate({ address: address }, update_usdt, {
                new: true,
            });

            break;
        case 'received_BUSD':
            var busd = Number(response.received_BUSD) + Number(value);
            let update_busd = { received_BUSD: busd };
            let doc2 = await User.findOneAndUpdate({ address: address }, update_busd, {
                new: true,
            });

            break;
        case 'received_PAX':
            var pax = Number(response.received_PAX) + Number(value);
            let update_pax = { received_PAX: pax };
            let doc3 = await User.findOneAndUpdate({ address: address }, update_pax, {
                new: true,
            });

            break;
        case 'received_ETH':
            var eth = Number(response.received_ETH) + Number(value);
            let update_eth = { received_ETH: eth };
            let doc5 = await User.findOneAndUpdate({ address: address }, update_eth, {
                new: true,
            });
            break;
        case 'received_BNB':
            var bnb = Number(response.received_BNB) + Number(value);
            let update_bnb = { received_BNB: bnb };
            let doc6 = await User.findOneAndUpdate({ address: address }, update_bnb, {
                new: true,
            });
            break;
        case 'received_CTY':
            var cty = Number(response.received_CTY) + Number(value);
            let update_cty = { received_CTY: cty };
            let doc7 = await User.findOneAndUpdate({ address: address }, update_cty, {
                new: true,
            });
            break;
        default:
            console.log('Unknow token!');
            return;
    }
};
module.exports = {
    updateUser,
};
