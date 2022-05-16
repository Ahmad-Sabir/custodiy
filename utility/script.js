const mongoose = require("mongoose");

var withNoapprover = (id) => {
    return [
        {
            $match: { _id: mongoose.Types.ObjectId(id) },
        },
        {
            $lookup: {
                from: "custodies",
                localField: "Transfer",
                foreignField: "address",
                as: "Transfer",
            },
        },
        { $unwind: "$Transfer" },
        {
            $lookup: {
                from: "custodies",
                localField: "Beneficiary",
                foreignField: "address",
                as: "Beneficiary",
            },
        },
        { $unwind: "$Beneficiary" },
        {
            $project: {
                "Transfer.privateKey": 0,
                "Transfer.__v": 0,
                "Transfer.send_USDC": 0,
                "Transfer.send_PAX": 0,
                "Transfer.send_BUSD": 0,
                "Transfer.received_BUSD": 0,
                "Transfer.send_USDT": 0,
                "Transfer.received_USDC": 0,
                "Transfer.received_PAX": 0,
                "Transfer.received_USDT": 0,
                "Transfer.received_BNB": 0,
                "Transfer.received_ETH": 0,
                "Transfer.send_BNB": 0,
                "Transfer.send_ETH": 0,
                "Transfer.send_CTY": 0,
                "Transfer.BTC_address": 0,
                "Transfer.BANK_account": 0,
                "Beneficiary.privateKey": 0,
                "Beneficiary.__v": 0,
                "Beneficiary.send_USDC": 0,
                "Beneficiary.send_PAX": 0,
                "Beneficiary.send_BUSD": 0,
                "Beneficiary.received_BUSD": 0,
                "Beneficiary.send_USDT": 0,
                "Beneficiary.received_USDC": 0,
                "Beneficiary.received_PAX": 0,
                "Beneficiary.received_USDT": 0,
                "Beneficiary.received_BNB": 0,
                "Beneficiary.received_ETH": 0,
                "Beneficiary.send_BNB": 0,
                "Beneficiary.send_ETH": 0,
                "Beneficiary.send_CTY": 0,
                "Beneficiary.BTC_address": 0,
                "Beneficiary.BANK_account": 0,
            },
        },
    ];
};

var withapprover = (id) => {
    return [
        {
            $match: { _id: mongoose.Types.ObjectId(id) },
        },
        {
            $lookup: {
                from: "custodies",
                localField: "Transfer",
                foreignField: "address",
                as: "Transfer",
            },
        },
        { $unwind: "$Transfer" },
        {
            $lookup: {
                from: "custodies",
                localField: "Beneficiary",
                foreignField: "address",
                as: "Beneficiary",
            },
        },
        { $unwind: "$Beneficiary" },
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
                "Transfer.privateKey": 0,
                "Transfer.__v": 0,
                "Transfer.send_USDC": 0,
                "Transfer.send_PAX": 0,
                "Transfer.send_BUSD": 0,
                "Transfer.received_BUSD": 0,
                "Transfer.send_USDT": 0,
                "Transfer.received_USDC": 0,
                "Transfer.received_PAX": 0,
                "Transfer.received_USDT": 0,
                "Transfer.received_BNB": 0,
                "Transfer.received_ETH": 0,
                "Transfer.send_BNB": 0,
                "Transfer.send_ETH": 0,
                "Transfer.send_CTY": 0,
                "Transfer.BTC_address": 0,
                "Transfer.BANK_account": 0,
                "Beneficiary.privateKey": 0,
                "Beneficiary.__v": 0,
                "Beneficiary.send_USDC": 0,
                "Beneficiary.send_PAX": 0,
                "Beneficiary.send_BUSD": 0,
                "Beneficiary.received_BUSD": 0,
                "Beneficiary.send_USDT": 0,
                "Beneficiary.received_USDC": 0,
                "Beneficiary.received_PAX": 0,
                "Beneficiary.received_USDT": 0,
                "Beneficiary.received_BNB": 0,
                "Beneficiary.received_ETH": 0,
                "Beneficiary.send_BNB": 0,
                "Beneficiary.send_ETH": 0,
                "Beneficiary.send_CTY": 0,
                "Beneficiary.BTC_address": 0,
                "Beneficiary.BANK_account": 0,
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
    ];
};

var getAllContracts = (response = undefined, limit = 10, skip = 0) => {
    return [
        {
            $match: {
                $or: [
                    { Transfer: response.address },
                    { Beneficiary: response.address },
                    { Approver: response.address },
                ],
            },
        },
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
    ];
};

module.exports = {
    withNoapprover,
    withapprover,
    getAllContracts,
};
