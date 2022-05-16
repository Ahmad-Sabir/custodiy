const User = require('../models/User');
const Contracts = require('../models/TransactionModel');
const Transaction_History = require('../models/contractStatusModel');
const { getAllContracts } = require('../utility/script');

var getCompletedInfo = async (email, limit, skip) => {
    try {
        var user = await User.find({ email: email });
        const [response] = user;
        const a = await Contracts.aggregate(getAllContracts(response, limit, skip));
        console.log(a);
        var count = await Contracts.countDocuments({
            $or: [
                { Transfer: response.address },
                { Beneficiary: response.address },
                { Approver: response.address },
            ],
        });
        for (var i = 0; i < a.length; i++) {
            if (a[i].Transfer === response.address) {
                a[i].role = 'sender';
            } else if (a[i].Beneficiary === response.address) {
                a[i].role = 'receiver';
            } else if (a[i].Approver.address === response.address) {
                a[i].role = 'approver';
            }
        }
        return {
            success: true,
            length: count,
            result: a,
        };
    } catch (e) {
        return {
            success: false,
            Message: e.message,
        };
    }
};

var getWaitingInfo = async (email) => {
    try {
        var user = await User.find({ email: email });
        const [response] = user;

        var sendContract = await Contracts.find({
            Transfer: response.address,
            Pending: true,
        })
            .sort({ _id: -1 })
            .exec();

        var recieveContract = await Contracts.find({
            Beneficiary: response.address,
            Pending: true,
        })
            .sort({ _id: -1 })
            .exec();

        var approveContract = await Contracts.find({
            Approver: response.address,
            Pending: true,
        })
            .sort({ _id: -1 })
            .exec();
        if (sendContract === undefined && recieveContract === undefined && approveContract === undefined)
            return {
                success: false,
                Message: 'No records found!',
            };
        if (sendContract.length == 0 && recieveContract.length == 0 && approveContract.length == 0) {
            return {
                success: false,
                Message: 'No records found!',
            };
        }
        return {
            success: true,
            Send: sendContract,
            Recieve: recieveContract,
            Approve: approveContract,
        };
    } catch (e) {
        return {
            success: false,
            Message: e.message,
        };
    }
};
var transaction = async (email) => {
    try {
        var user1 = await User.find({ email: email });
        const [response] = user1;
        var user_send = await Transaction_History.find({
            sender: response.address,
        })
            .sort({ _id: -1 })
            .exec();
        var user_receive = await Transaction_History.find({
            receiver: response.address,
        })
            .sort({ _id: -1 })
            .exec();

        if (user_send.length == 0 && user_receive.length == 0) {
            return {
                success: false,
                Message: 'No records found!',
            };
        } else {
            return {
                success: true,
                Send: user_send,
                Recieve: user_receive,
            };
        }
    } catch (e) {
        return {
            success: false,
            Message: 'No records found!',
        };
    }
};

module.exports = {
    getCompletedInfo,
    getWaitingInfo,
    transaction,
};
