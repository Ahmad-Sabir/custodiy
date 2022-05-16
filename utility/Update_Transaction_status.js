const Contract = require('../models/contractStatusModel');
const Contracts_Transaction = require('../models/TransactionModel');
const { updateContract } = require('./contracts');
var Change_Transaction_status = async (
    sender,
    FileName,
    receiver,
    hash,
    date,
    status,
    amount,
    type,
    token
) => {
    console.log(sender, FileName, receiver, hash, date, status, amount, type, token);
    var data = new Contracts_Transaction();
    data.Transfer = sender;
    data.Beneficiary = receiver;
    data.hash = hash;
    data.Date = date;
    data.FileName = FileName;
    data.Amount = amount;
    data.status = status;
    data.Name = type;
    data.Symbol = token;
    data.type = 'transaction';
    console.log(data);
    try {
        await data.save();
        return true;
    } catch (e) {
        return false;
    }
};
var Change_Contract_status = async (id, status) => {
    let update_pending = { Pending: false, status: status };
    if (update_pending.status == 'Completed') {
        update_pending.transaction_approved = true;
    }
    try {
        let doc = await Contracts_Transaction.findOneAndUpdate({ _id: id }, update_pending, {
            new: true,
        });
        //console.log('here',doc.Transfer,doc._id,update_pending.status);
        const update = await updateContract(doc.Transfer, doc._id, update_pending.status);

        return true;
    } catch (e) {
        return false;
    }
};
var Change_Approver_Status = async (id) => {
    let update_Approve = { transaction_approved: true };
    try {
        let [check_status] = await Contracts_Transaction.find({ _id: id });

        if (check_status.transaction_approved == true) {
            return {
                success: true,
                transaction_status: true,
                Message: 'Transaction already approved',
            };
        } else {
            let doc = await Contracts_Transaction.findOneAndUpdate({ _id: id }, update_Approve, {
                new: true,
            });
            return {
                success: true,
                transaction_status: true,
                Message: 'Transaction approved successfully',
            };
        }
    } catch (e) {
        return { success: false, Message: 'Failed to approve transaction' };
    }
};
var Change_third_party_Approver_Status = async (id, address) => {
    let update_Approve = { transaction_approved: true };
    let update_third_party_approve = { third_party_approver: true };
    try {
        let [check_status] = await Contracts_Transaction.find({ _id: id, Approver: address });
        if (check_status.Approver && check_status.status === 'Waiting') {
            if (check_status.Beneficiary == check_status.Approver) {
                if (check_status.transaction_approved == true) {
                    return {
                        success: true,
                        transaction_status: true,
                        Message: 'Transaction already approved',
                    };
                } else {
                    let doc = await Contracts_Transaction.findOneAndUpdate(
                        { _id: id },
                        update_Approve,
                        {
                            new: true,
                        }
                    );
                    return {
                        success: true,
                        transaction_status: true,
                        Message: 'Transaction updated successfully',
                    };
                }
            } else {
                if (check_status.third_party_approver == true) {
                    return {
                        success: true,
                        transaction_status: true,
                        Message: 'Transaction already approved',
                    };
                } else {
                    let doc = await Contracts_Transaction.findOneAndUpdate(
                        { _id: id },
                        update_third_party_approve,
                        {
                            new: true,
                        }
                    );
                    return {
                        success: true,
                        transaction_status: true,
                        Message: 'Transaction Approved successfully',
                    };
                }
            }
        } else {
            return {
                success: false,
                Message: 'Operation failed',
            };
        }
    } catch (e) {
        return {
            success: false,
            transaction_status: 'Not Approved',
            Message: 'Failed to approve transaction',
        };
    }
};

module.exports = {
    Change_Transaction_status,
    Change_Contract_status,
    Change_Approver_Status,
    Change_third_party_Approver_Status,
};
