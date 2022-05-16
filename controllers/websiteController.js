const Web3 = require("web3");
const fs = require("fs");
const cron = require("node-cron");
const axios = require("axios");
const moment = require("moment");
const web3 = new Web3(process.env.ETH_LINK);
const web3Busd = new Web3(process.env.ETH_LINK);
const web3BNB = new Web3(process.env.BNB_LINK);

const checkBalance = require("../utility/checkBalance");
var contract_hold_Balance = require("../utility/contract_holding_balance");
const Contract = require("../models/TransactionModel");
const User = require("../models/User");
const Balance = require("../models/Balance");
const getContracts = require("./getContractInfo");
const { getAllContracts } = require("../utility/script");
const { withapprover, withNoapprover } = require("../utility/script");

var get_Contracts = async (req, res) => {
    try {
        const skip = req.body.skip || 0;
        const limit = req.body.limit || 10;
        var contracts = await Contract.aggregate([
            {
                $lookup: {
                    from: "custodies",
                    localField: "Approver",
                    foreignField: "address",
                    as: "Approver",
                },
            },
            { $unwind: { path: "$Approver", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    "Approver.privateKey": 0,
                    "Approver.__v": 0,
                    "Approver.send_USDC": 0,
                    "Approver.send_PAX": 0,
                    "Approver.send_BUSD": 0,
                    "Approver.received_BUSD": 0,
                    "Approver.send_USDT": 0,
                    "Approver.received_USDC": 0,
                    "Approver.received_PAX": 0,
                    "Approver.received_USDT": 0,
                    "Approver.received_BNB": 0,
                    "Approver.received_ETH": 0,
                    "Approver.send_BNB": 0,
                    "Approver.send_ETH": 0,
                    "Approver.send_CTY": 0,
                    "Approver.BTC_address": 0,
                    "Approver.BANK_account": 0,
                },
            },
            { $sort: { _id: -1 } },
            { $limit: skip + limit },
            { $skip: skip },
        ]);
        var count = await Contract.countDocuments();
        return res.status(200).send({
            status: 200,
            success: true,
            count: count,
            result: contracts,
        });
    } catch (e) {
        console.log(e);
        return res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to find Contracts",
        });
    }
};

var getOneTransaction = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).send({
                status: 400,
                success: false,
                Error: "Enter transaction hash please",
            });
        }
        var transaction = await Contract.findOne({
            hash: req.params.id,
        });
        if (!transaction) {
            return res.status(404).send({
                status: 404,
                success: false,
                Error: "No Transaction Found",
            });
        }
        var trans;
        if (transaction.Approver) {
            trans = await Contract.aggregate(withapprover(transaction._id));
        } else {
            trans = await Contract.aggregate(withNoapprover(transaction._id));
        }
        return res.status(200).send({
            status: 200,
            success: true,
            result: trans,
        });
    } catch (e) {
        console.log(e);
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to find Contracts",
        });
    }
};

var transactionStat = async (req, res) => {
    try {
        if (!req.query.token) {
            return res.status(400).send({
                status: 400,
                success: false,
                Error: "token required query params",
            });
        }
        if (!req.query.min || !req.query.max) {
            return res.status(400).send({
                status: 400,
                success: false,
                Error: "min & max dates are required in query params",
            });
        }

        const stat = await Contract.aggregate([
            {
                $match: {
                    Symbol: req.query.token,
                    status: "Completed",
                    type: "transaction",
                    createdAt: {
                        $lte: moment(new Date(req.query.max)).toDate(),
                        $gte: moment(new Date(req.query.min)).toDate(),
                    },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalAmount: { $sum: { $convert: { input: "$Amount", to: "double" } } },
                },
            },
            {
                $addFields: {
                    date: "$_id",
                },
            },
            {
                $project: {
                    _id: 0,
                    date: 1,
                    totalAmount: 1,
                },
            },
            {
                $sort: {
                    date: 1,
                },
            },
        ]);
        return res.status(200).send({
            status: 200,
            success: true,
            result: stat,
        });
    } catch (e) {
        console.log(e);
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to find Contracts",
        });
    }
};

var totalUsers = async (req, res) => {
    try {
        const users = await User.countDocuments();
        return res.status(200).send({
            status: 200,
            success: true,
            result: {
                totalUsers: users,
            },
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to fetch users",
        });
    }
};
var contractDetails = async (req, res) => {
    try {
        const stat = await Contract.aggregate([
            {
                $match: {
                    type: "contract",
                },
            },
            {
                $group: {
                    _id: "$status",
                    total: { $sum: 1 },
                },
            },
            {
                $addFields: {
                    status: "$_id",
                },
            },
            {
                $project: {
                    _id: 0,
                    status: 1,
                    total: 1,
                },
            },
        ]);
        var total = 0;
        var completed = 0;
        var waiting = 0;
        var declined = 0;
        stat.forEach((el) => {
            total = total + el.total;
            completed = el.status == "Completed" ? completed + el.total : completed + 0;
            declined = el.status == "Declined" ? declined + el.total : declined + 0;
            waiting = el.status == "Waiting" ? waiting + el.total : waiting + 0;
        });
        return res.status(200).send({
            status: 200,
            success: true,
            result: { total, completed, declined, waiting },
        });
    } catch (e) {
        console.log(e);
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to find Contracts",
        });
    }
};

var totalBalance = async (req, res) => {
    try {
        const balance = await Balance.find().sort("-createdAt").limit(1);
        return res.status(200).send({
            status: 200,
            success: true,
            result: {
                totalBalance: balance[0].balance,
            },
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to fetch users",
        });
    }
};

var total_usd_balance = async (address) => {
    var pax_Address = process.env.pax_contract_address;
    var pax_abiArray = JSON.parse(fs.readFileSync("pax.json", "utf-8"));
    var pax_instance = new web3.eth.Contract(pax_abiArray, pax_Address);
    var usdt_Address = process.env.usdt_contract_address;
    var usdt_abiArray = JSON.parse(fs.readFileSync("usdt.json", "utf-8"));
    var usdt_instance = new web3.eth.Contract(usdt_abiArray, usdt_Address);
    var usdc_Address = process.env.usdc_contract_address;
    var usdc_abiArray = JSON.parse(fs.readFileSync("usdc.json", "utf-8"));
    var usdc_instance = new web3.eth.Contract(usdc_abiArray, usdc_Address);
    var busd_Address = process.env.busd_contract_address;
    var busd_abiArray = JSON.parse(fs.readFileSync("busd.json", "utf-8"));
    var busd_instance = new web3Busd.eth.Contract(busd_abiArray, busd_Address);
    var cty_Address = process.env.cty_contract_address;
    var cty_abiArray = JSON.parse(fs.readFileSync("busd.json", "utf-8"));
    var cty_instance = new web3BNB.eth.Contract(cty_abiArray, cty_Address);
    try {
        var bal = await contract_hold_Balance(address);
        var user_pax_token = await pax_instance.methods.balanceOf(address).call();
        var user_usdc_token = await usdc_instance.methods.balanceOf(address).call();
        var user_usdt_token = await usdt_instance.methods.balanceOf(address).call();
        var user_busd_token = await busd_instance.methods.balanceOf(address).call();
        var user_cty_token = await cty_instance.methods.balanceOf(address).call();
        var eth_balance = await web3.eth.getBalance(address);
        var bnb_balance = await web3BNB.eth.getBalance(address);
        var pax = await web3.utils.fromWei(user_pax_token, "ether");
        var usdc = await web3.utils.fromWei(user_usdc_token, "mwei");
        var usdt = await web3.utils.fromWei(user_usdt_token, "mwei");
        var busd = await web3Busd.utils.fromWei(user_busd_token, "ether");
        var cty = await web3BNB.utils.fromWei(user_cty_token, "ether");
        var eth = await web3.utils.fromWei(eth_balance, "ether");
        var bnb = await web3BNB.utils.fromWei(bnb_balance, "ether");
        console.log(await checkBalance.contract_holding_gas(address));
        eth = Number(eth) - (await checkBalance.contract_holding_gas(address));
        bnb = Number(bnb) - (await checkBalance.contract_holding_gas_BNB(address));
        console.log(eth, pax, usdc, usdt, busd, bnb, cty);
        var usd_per_usdc = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=USDC");
        var usd_per_usdt = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=USDT");
        var usd_per_pax = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=PAX");
        var usd_per_busd = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=BUSD");
        var usd_per_cty = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=BUSD");
        var usd_per_eth = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=ETH");
        var usd_per_bnb = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=BNB");
        var [_usdc] = usd_per_usdc.data.data;
        var [_usdt] = usd_per_usdt.data.data;
        var [_pax] = usd_per_pax.data.data;
        var [_eth] = usd_per_eth.data.data;
        var [_busd] = usd_per_busd.data.data;
        var [_cty] = usd_per_cty.data.data;
        var [_bnb] = usd_per_bnb.data.data;
        var amount =
            Number(pax) * _pax.price +
            Number(usdc) * _usdc.price +
            Number(usdt) * _usdt.price +
            Number(busd) * _busd.price +
            Number(cty) * _cty.price +
            Number(eth) * _eth.price +
            Number(bnb) * _bnb.price;
        var total_balance = amount - bal;
        return total_balance.toFixed(2);
    } catch (e) {
        return 0;
    }
};
cron.schedule("01 00 * * *", async function () {
    console.log("----------start-total-usd-----------");
    const users = await User.find();
    var total = 0;
    for (var i = 0; i < users.length; i++) {
        total = total + Number(await total_usd_balance(users[i].address));
    }
    const balance = await Balance.create({ balance: total });
    if (balance) {
        console.log(balance);
        console.log("----------end-total-usd-----------");
    }
});
module.exports = { get_Contracts, getOneTransaction, transactionStat, totalUsers, contractDetails, totalBalance };
