const Contracts = require('../models/TransactionModel');
const User = require('../models/User');
const scheduleRouter = require('../utility/schedularUtil');
const Transaction_Status = require('../utility/Update_Transaction_status');

const dateFormat = (today) => {
    var date =
        (today.getMonth() > 8 ? today.getMonth() + 1 : '0' + (today.getMonth() + 1)) +
        '/' +
        (today.getDate() > 9 ? today.getDate() : '0' + today.getDate()) +
        '/' +
        today.getFullYear();
    return date;
};

const pendingContracts = async (today) => {
    var date = dateFormat(today);
    var _pendingContracts = await Contracts.find({
        Date: date,
        Pending: true,
        third_party_approver: undefined,
    });
    var pendingContracts = await Contracts.find({
        Date: date,
        Pending: true,
        third_party_approver: true,
    });
    return [..._pendingContracts, ...pendingContracts];
};

const pendingUnapprovedContracts = async (today) => {
    var date = dateFormat(today);
    var _pendingContracts = await Contracts.find({
        Date: date,
        Pending: true,
        third_party_approver: false,
    });

    return _pendingContracts;
};

const makeTransactions = async (today) => {
    var _pendingContracts = await pendingContracts(today);

    for (let doc of _pendingContracts) {
        var [user] = await User.find({
            address: doc.Transfer,
        });

        let [receipt, admin] = await scheduleRouter(doc, user);
        console.log(receipt, 'true');
        if (receipt.status) {
            let status = await Transaction_Status.Change_Transaction_status(
                doc.Transfer,
                doc.FileName,
                doc.Beneficiary,
                receipt.transactionHash,
                doc.Date,
                'Completed',
                doc.Amount,
                doc.Name,
                doc.Symbol
            );
            await Transaction_Status.Change_Contract_status(doc._id, 'Completed');
            if (status) {
                console.log('Transaction completed Successfully');
            }
            if (admin) {
                let adminStatus = await Transaction_Status.Change_Transaction_status(
                    doc.Transfer,
                    doc.FileName,
                    process.env.ADMIN_ADDRESS,
                    admin.transactionHash,
                    doc.Date,
                    'Completed',
                    doc.adminFee,
                    doc.Name,
                    doc.Symbol
                );
                if (adminStatus) {
                    console.log('AdminFee Transaction completed Successfully');
                }
            }
        } else {
            await Transaction_Status.Change_Contract_status(doc._id, 'Failed');
        }
    }
};

const declineTransactions = async (today) => {
    var _pendingContracts = await pendingUnapprovedContracts(today);
    for (let doc of _pendingContracts) {
        await Transaction_Status.Change_Contract_status(doc._id, 'Declined');
    }
};

const makeSingleTransaction = async (doc) => {
    var user = await User.findOne({
        address: doc.Transfer,
    });
    let [receipt, admin] = await scheduleRouter(doc, user);
    console.log(receipt, 'true');
    if (receipt.status) {
        let status = await Transaction_Status.Change_Transaction_status(
            doc.Transfer,
            doc.FileName,
            doc.Beneficiary,
            receipt.transactionHash,
            doc.Date,
            'Completed',
            doc.Amount,
            doc.Name,
            doc.Symbol
        );
        await Transaction_Status.Change_Contract_status(doc._id, 'Completed');
        if (status) {
            console.log('Transaction completed Successfully');
        }
        if (admin) {
            let adminStatus = await Transaction_Status.Change_Transaction_status(
                doc.Transfer,
                doc.FileName,
                process.env.ADMIN_ADDRESS,
                admin.transactionHash,
                doc.Date,
                'Completed',
                doc.adminFee,
                doc.Name,
                doc.Symbol
            );
            if (adminStatus) {
                console.log('AdminFee Transaction completed Successfully');
            }
        }
    } else {
        await Transaction_Status.Change_Contract_status(doc._id, 'Failed');
    }
};

const rejectSingleTransaction = async (doc) => {
    var user = await User.find({
        address: doc.Transfer,
    });
    await Transaction_Status.Change_Contract_status(doc._id, 'Rejected');
};

module.exports = {
    makeTransactions,
    dateFormat,
    makeSingleTransaction,
    declineTransactions,
    rejectSingleTransaction,
};
