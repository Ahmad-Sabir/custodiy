const mongoose = require('mongoose');
const withdraw = new mongoose.Schema(
    {
        txId: {
            type: String,
            unique: true,
            sparse: true,
        },
        txId2: {
            type: String,
            unique: true,
            sparse: true,
        },
        source: {
            type: String,
        },
        sourceCurrency: {
            type: String,
        },
        sourceAmount: {
            type: Number,
            required: true,
        },
        destAmount: {
            type: Number,
        },
        destCurrency: {
            type: String,
        },
        hash: {
            type: String,
        },
        action: {
            type: String,
            enum: ['BTC_transfer', 'BANK_transfer'],
            required: true,
        },
        status: {
            type: String,
            enum: ['INITIATED', 'PENDING', 'COMPLETED', 'FAILED'],
        },
        reason: {
            type: String,
        },
        dest: {
            type: Object,
        },
    },
    {
        timestamps: true,
    }
);

const Withdraw = mongoose.model('withdraw', withdraw);
module.exports = Withdraw;
