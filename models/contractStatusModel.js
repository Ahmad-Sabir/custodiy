const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Contract_status_Schema = new Schema({
    sender: {
        type: String,
        required: true,
    },
    receiver: {
        type: String,
        required: true,
    },
    hash: {
        type: String,
        required: true,
        default: 'Null',
    },
    Date: {
        type: String,
        required: true,
    },
    Amount: {
        type: String,
    },
    status: {
        type: String,
        required: true,
    },
    Name: {
        type: String,
    },
    Symbol: {
        type: String,
    },
});

const Contract = mongoose.model('Contruct_Status', Contract_status_Schema);
module.exports = Contract;
