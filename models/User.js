const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
    id: ObjectId,
    address: {
        type: String,
    },
    privateKey: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    BTC_address: {
        type: String,
    },
    BANK_account: {
        type: Object,
    },
    send_USDT: {
        type: Number,
    },
    send_USDC: {
        type: Number,
    },
    send_PAX: {
        type: Number,
    },
    send_BNB: {
        type: Number,
    },
    send_ETH: {
        type: Number,
    },
    send_BUSD: {
        type: Number,
    },
    send_CTY: {
        type: Number,
        default: 0,
    },
    received_USDT: {
        type: Number,
    },
    received_USDC: {
        type: Number,
    },
    received_PAX: {
        type: Number,
    },
    received_BUSD: {
        type: Number,
        default: 0,
    },
    received_CTY: {
        type: Number,
        default: 0,
    },
    received_BNB: {
        type: Number,
    },
    received_ETH: {
        type: Number,
    },
});

const Custody = mongoose.model('Custody', userSchema);
module.exports = Custody;
