const User = require('../models/User');

var updateUser = async (token, value, address) => {
    var user = await User.find({ address: address });

    if (user.length == 0) {
        throw new Error('Address Not Exist');
    }
    const [response] = user;
    console.log(token, value, address);
    switch (token) {
        case 'send_USDC':
            var usdc = Number(response.send_USDC) + Number(value);
            let update_usdc = { send_USDC: usdc };
            let doc1 = await User.findOneAndUpdate({ address: address }, update_usdc, {
                new: true,
            });
            break;
        case 'send_USDT':
            var usdt = Number(response.send_USDT) + Number(value);
            let update_usdt = { send_USDT: usdt };
            let doc2 = await User.findOneAndUpdate({ address: address }, update_usdt, {
                new: true,
            });
            break;
        case 'send_BUSD':
            var busd = Number(response.send_BUSD) + Number(value);
            let update_busd = { send_BUSD: busd };
            let doc4 = await User.findOneAndUpdate({ address: address }, update_busd, {
                new: true,
            });
            break;
        case 'send_PAX':
            var pax = Number(response.send_PAX) + Number(value);
            let update_pax = { send_PAX: pax };
            let doc3 = await User.findOneAndUpdate({ address: address }, update_pax, {
                new: true,
            });
            break;
        case 'send_BNB':
            var bnb = Number(response.send_BNB) + Number(value);
            let update_bnb = { send_BNB: bnb };
            let doc5 = await User.findOneAndUpdate({ address: address }, update_bnb, {
                new: true,
            });
            break;
        case 'send_ETH':
            var eth = Number(response.send_ETH) + Number(value);
            let update_eth = { send_ETH: eth };
            let doc6 = await User.findOneAndUpdate({ address: address }, update_eth, {
                new: true,
            });
            break;
        case 'send_CTY':
            var cty = Number(response.send_CTY) + Number(value);
            let update_cty = { send_CTY: cty };
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
