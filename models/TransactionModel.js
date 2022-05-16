const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        Name: {
            type: String,
            required: true,
        },
        Amount: {
            type: String,
            required: true,
        },
        Transfer: {
            type: String,
            required: true,
        },
        Beneficiary: {
            type: String,
            required: true,
        },
        Date: {
            type: String,
            required: true,
        },
        Approver: {
            type: String,
        },
        adminFee: {
            type: Number,
        },
        onHoldGas: {
            type: Number,
        },
        transaction_approved: {
            type: Boolean,
        },
        third_party_approver: {
            type: Boolean,
        },
        Pending: {
            type: Boolean,
        },
        Symbol: {
            type: String,
            required: true,
        },
        FileName: {
            type: Array,
        },
        hash: {
            type: String,
        },
        status: {
            type: String,
            enum: {
                values: ["Waiting", "Completed", "Failed"],
                message: "status must be Waiting, Completed or Failed",
            },
            default: "Waiting",
        },
        type: {
            type: String,
        },
        role: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const Contract = mongoose.model("Contract", userSchema);
module.exports = Contract;
