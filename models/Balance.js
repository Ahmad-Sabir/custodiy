const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const balanceSchema = new Schema(
    {
        balance: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

const Balance = mongoose.model("Balance", balanceSchema);
module.exports = Balance;
