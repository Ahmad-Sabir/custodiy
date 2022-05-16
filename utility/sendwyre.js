const axios = require('axios');
const User = require('../models/User');
const Withdraw = require('../models/withdraw');

const Transfer = async (body) => {
    return await axios.post(process.env.TRANSFER_API_V3, body, {
        headers: {
            Authorization: `Bearer ${process.env.MAIN_NET_TOKEN}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });
};

const reverseTransaction = async (wallet, sourceCurrency, destCurrency, dest, sourceAmount) => {
    await axios.post(
        process.env.TRANSFER_API_V3,
        {
            autoConfirm: true,
            source: `wallet:${wallet}`,
            sourceCurrency: `${sourceCurrency}`,
            sourceAmount: `${sourceAmount}`,
            destCurrency: `${destCurrency}`,
            dest: `${dest}`, // Send to user
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.MAIN_NET_TOKEN}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }
    );
};

const sendAdminToBtc = async () => {
    const URL = `${process.env.TRANSFER_API_V2}/wallet:${process.env.BTC_WALLET_ID}`;
    let token = `Bearer ${process.env.MAIN_NET_TOKEN}`;
    const { data: respData } = await axios.get(URL, {
        headers: { Authorization: token },
    });
    const { data } = respData;
    if (data.length == 0) {
        return next(new AppError('No new Record into the history', STATUS_CODE.BAD_REQUEST));
    }
    //console.log(data);
    for (let d in data) {
        if (data[d].id === 'TF_FUL3JXYB379') {
            continue;
        }
        const exist = await Withdraw.findOne({ txId: data[d].id });
        if (exist) {
            continue;
        }
        if (data[d].type !== 'INCOMING' || data[d].sourceCurrency == 'BTC') {
            continue;
        }
        const init = `^${data[d].blockchainTxId}$`;
        const initiate = await Withdraw.findOne({
            hash: { $regex: init, $options: 'i' },
            status: 'INITIATED',
        });
        if (!initiate) {
            continue;
        }
        let src = data[d].source.split(':');
        let {
            fees: txFees,
            id,
            source,
            destAmount,
            destCurrency,
            sourceCurrency,
            sourceAmount,
            status,
        } = data[d];
        let txFee = 0;
        txFee = Object.entries(txFees).length === 0 ? 0 : Object.values(txFees)[0];
        //console.log(data[d].status);
        if (data[d].status == 'COMPLETED') {
            let result;
            try {
                result = await Transfer({
                    autoConfirm: true,
                    source: `wallet:${process.env.BTC_WALLET_ID}`,
                    sourceCurrency: `${sourceCurrency}`,
                    sourceAmount: `${destAmount}`,
                    destCurrency: 'BTC',
                    dest: `${initiate.dest.address}`,
                });
            } catch (e) {
                console.log(e);
                try {
                    await reverseTransaction(
                        process.env.BTC_WALLET_ID,
                        sourceCurrency,
                        sourceCurrency,
                        source.split(':')[1],
                        sourceAmount
                    );
                } catch (e) {
                    console.log(e);
                    continue;
                }
                await Withdraw.findOneAndUpdate(
                    { hash: { $regex: init, $options: 'i' } },
                    {
                        txId: id,
                        source: source.split(':')[1],
                        sourceCurrency,
                        destCurrency: 'BTC',
                        sourceAmount: sourceAmount,
                        status: 'FAILED',
                        action: 'BTC_transfer',
                        reason: 'Request failed',
                    }
                );
                continue;
            }
            try {
                //console.log(init);
                const b = await Withdraw.findOneAndUpdate(
                    { hash: { $regex: init, $options: 'i' } },
                    {
                        txId: id,
                        txId2: result.data.id,
                        destAmount: result.data.destAmount,
                        source: source.split(':')[1],
                        sourceCurrency,
                        destCurrency: 'BTC',
                        sourceAmount: sourceAmount,
                        status: 'PENDING',
                        action: 'BTC_transfer',
                    }
                );
                console.log(b);
            } catch (e) {
                console.log(e);
                continue;
            }
        }
    }
};

const sendAdminToUSD = async () => {
    const URL = `${process.env.TRANSFER_API_V2}/wallet:${process.env.USD_WALLET_ID}`;
    let token = `Bearer ${process.env.MAIN_NET_TOKEN}`;
    const { data: respData } = await axios.get(URL, {
        headers: { Authorization: token },
    });
    const { data } = respData;
    if (data.length == 0) {
        return next(new AppError('No new Record into the history', STATUS_CODE.BAD_REQUEST));
    }
    for (let d in data) {
        const exist = await Withdraw.findOne({ txId: data[d].id });
        if (exist) {
            continue;
        }
        if (
            data[d].type !== 'INCOMING' ||
            data[d].sourceCurrency == 'BTC' ||
            data[d].sourceCurrency == 'USD'
        ) {
            continue;
        }
        const init = `^${data[d].blockchainTxId}$`;
        const initiate = await Withdraw.findOne({
            hash: { $regex: init, $options: 'i' },
            status: 'INITIATED',
        });
        console.log(initiate);
        if (!initiate) {
            continue;
        }
        let src = data[d].source.split(':');
        let {
            fees: txFees,
            id,
            source,
            destAmount,
            destCurrency,
            sourceCurrency,
            sourceAmount,
            status,
        } = data[d];
        let txFee = 0;
        txFee = Object.entries(txFees).length === 0 ? 0 : Object.values(txFees)[0];
        console.log(data[d].status);
        if (data[d].status == 'COMPLETED') {
            let result;
            try {
                result = await Transfer({
                    autoConfirm: true,
                    source: `wallet:${process.env.USD_WALLET_ID}`,
                    sourceCurrency: `${sourceCurrency}`,
                    sourceAmount: `${destAmount}`,
                    destCurrency: initiate.dest.currency,
                    dest: { ...initiate.dest }, // Send to user
                });
            } catch (e) {
                console.log(e.message);
                await reverseTransaction(
                    process.env.USD_WALLET_ID,
                    sourceCurrency,
                    sourceCurrency,
                    source.split(':')[1],
                    sourceAmount
                );
                await Withdraw.findOneAndUpdate(
                    { hash: { $regex: init, $options: 'i' } },
                    {
                        txId: id,
                        source: source.split(':')[1],
                        sourceCurrency,
                        destCurrency: initiate.dest.currency,
                        sourceAmount: sourceAmount,
                        status: 'FAILED',
                        action: 'BANK_transfer',
                        reason: 'Request failed',
                    }
                );
                continue;
            }
            console.log(result);
            await Withdraw.findOneAndUpdate(
                { hash: { $regex: init, $options: 'i' } },
                {
                    txId: id,
                    txId2: result.data.id,
                    destAmount: result.data.destAmount,
                    source: source.split(':')[1],
                    sourceCurrency,
                    destCurrency: result.data.destCurrency,
                    sourceAmount: sourceAmount,
                    status: 'PENDING',
                    action: 'BANK_transfer',
                }
            );
        }
    }
};

const usdToUser = async () => {
    try {
        const URL = `${process.env.TRANSFER_API_V2}/wallet:${process.env.USD_WALLET_ID}`;
        let token = `Bearer ${process.env.MAIN_NET_TOKEN}`;
        const { data: respData } = await axios.get(URL, {
            headers: { Authorization: token },
        });
        const { data } = respData;
        if (data.length == 0) {
            return next(new AppError('No new Record into the history', STATUS_CODE.BAD_REQUEST));
        }
        for (let d in data) {
            if (data[d].type !== 'OUTGOING') {
                continue;
            }
            if (data[d].destCurrency === 'BTC') {
                continue;
            }
            const exist = await Withdraw.findOne({ txId2: data[d].id, status: 'COMPLETED' });
            if (exist) {
                continue;
            }
            let { fees: txFees, id, status } = data[d];
            await Withdraw.findOneAndUpdate(
                { txId2: id },
                { status, hash: data[d].blockchainTxId },
                { new: true }
            );
        }
    } catch (e) {
        console.log(e);
        return e;
    }
};

const btcToUser = async () => {
    try {
        const URL = `${process.env.TRANSFER_API_V2}/wallet:${process.env.BTC_WALLET_ID}`;
        let token = `Bearer ${process.env.MAIN_NET_TOKEN}`;
        const { data: respData } = await axios.get(URL, {
            headers: { Authorization: token },
        });
        const { data } = respData;
        if (data.length == 0) {
            return next(new AppError('No new Record into the history', STATUS_CODE.BAD_REQUEST));
        }
        for (let d in data) {
            if (data[d].type !== 'OUTGOING') {
                continue;
            }
            if (data[d].destCurrency !== 'BTC') {
                continue;
            }
            const exist = await Withdraw.findOne({ txId2: data[d].id, status: 'COMPLETED' });
            if (exist) {
                continue;
            }
            let { fees: txFees, id, status } = data[d];
            await Withdraw.findOneAndUpdate(
                { txId2: id },
                { status, hash: data[d].blockchainTxId },
                { new: true }
            );
        }
    } catch (e) {
        console.log(e);
        return e;
    }
};

module.exports = { sendAdminToBtc, btcToUser, sendAdminToUSD, usdToUser };
