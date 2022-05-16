const Web3 = require("web3");
const fs = require("fs");
const cron = require("node-cron");
const mongoose = require("mongoose");
const Contract = require("../models/TransactionModel");
const User = require("../models/User");
const changePassword = require("../utility/changePassword");
const resetPassword = require("../controllers/resetPassword");
const getContracts = require("../controllers/getContractInfo");
const checkBalance = require("../utility/checkBalance");
const { addContract, updateContract } = require("../utility/contracts");
const { withapprover, withNoapprover } = require("../utility/script");
const {
    dateFormat,
    makeSingleTransaction,
    rejectSingleTransaction,
    makeTransactions,
    declineTransactions,
} = require("./scheduleController");
const Transaction_History = require("../models/contractStatusModel");
var transaction_approve = require("../utility/Update_Transaction_status");
const { sendAdminToBtc, btcToUser, sendAdminToUSD, usdToUser } = require("../utility/sendwyre");
const Regex = require("../utility/regex");
const { send_cty_to_admin } = require("../controllers/sendTokenController");
var validator = require("validator");
const axios = require("axios");
var jwt = require("jsonwebtoken");
var userAuth = require("../utility/userAuth");
var registerModel = require("../models/authUser");
var crypto = require("crypto");
var otpModel = require("../models/otpModel");
const bcrypt = require("bcrypt");
const { format } = require("../utility/Validation");

console.log(Regex.password);
const register = async (req, res) => {
    var otp = await userAuth.generateOtp();
    var name = req.body.firstName.toLowerCase() + " " + req.body.lastName.toLowerCase();
    var encrypt = function (plain_text, encryptionMethod, secret, iv) {
        var encryptor = crypto.createCipheriv(encryptionMethod, secret, iv);
        return encryptor.update(plain_text, "utf8", "base64") + encryptor.final("base64");
    };
    var encryptionMethod = "AES-256-CBC";
    var secret = "My32charPasswordAndInitVectorStr"; //must be 32 char length
    var iv = process.env.otp_secret.substr(0, 16);
    var encryptedMessage = encrypt(otp.toString(), encryptionMethod, process.env.otp_secret, iv);
    var find_existing_user = await registerModel.findOne({
        email: req.body.email,
    });
    if (!validator.isEmail(req.body.email)) {
        res.status(400).send({
            success: false,
            status: 400,
            Message: "Please Enter Correct Email",
        });
        return;
    }
    var regularExpression = Regex.password;
    ///^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    var password = req.body.password;
    if (!regularExpression.test(password)) {
        res.status(400).send({
            status: 400,
            success: false,
            Message:
                "Password at least one uppercase letter, one lowercase letter and one number and one special character and minimum 8 character",
        });
        return;
    }
    try {
        var nUser = await registerModel.findOne({ email: req.body.email });
        var user = await User.findOne({ email: req.body.email });
        var user_name = await User.findOne({ name: name });
        if (user) {
            return res.status(400).send({
                success: false,
                status: 400,
                Message: "Email already Exist",
            });
        }
        if (nUser) {
            return res.status(400).send({
                success: false,
                status: 400,
                Error: "notverified",
                Message: "Email already Exist",
            });
        }
        if (user_name) {
            return res.status(400).send({
                success: false,
                status: 400,
                Message: "User Name already Exist",
            });
        }

        const newUser = await registerModel.create({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: req.body.password,
            otp: otp,
        });

        res.status(200).send({
            success: true,
            status: 200,
            otp: encryptedMessage,
        });
    } catch (e) {
        res.status(400).send({
            success: false,
            status: 400,
            Message: "Field is Required",
        });
    }
};
var varifyOtp = async (req, res) => {
    try {
        if (!req.body.email || !req.body.otp) {
            return res.status(400).send({
                status: 400,
                success: false,
                Message: "please enter Email & Otp",
            });
        }
        var [newUser] = await registerModel.find({ email: req.body.email });
        var otp = crypto.createHash("sha256").update(req.body.otp).digest("hex");
        if (otp == newUser.otp && newUser.emailVerificationOtpExpires > Date.now()) {
            let verify_user = {
                isverified: true,
                emailVerificationOtpExpires: undefined,
                otp: undefined,
            };
            await otpModel.deleteMany({
                email: req.body.email,
                type: "verify",
            });
            var data = await userAuth.register(
                newUser.email,
                newUser.firstName,
                newUser.lastName,
                newUser.password,
                token
            );
            var token = await jwt.sign({ id: req.body.email, address: data.address }, process.env.secret, {
                expiresIn: 3600, // expires in 24 hours
            });
            console.log(data);
            console.log(token);
            data.token = token;
            req.session.jwt = token;
            let doc = await registerModel.findOneAndRemove({
                email: req.body.email,
            });
            res.status(200).send({
                success: true,
                status: 200,
                User: data,
            });
        } else if (newUser.emailVerificationOtpExpires < Date.now()) {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Error! Otp Expired",
            });
        } else {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Failed to varify otp",
            });
        }
    } catch (e) {
        console.log(e);
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to varify otp",
        });
    }
};
var resendOtp = async (req, res) => {
    try {
        var find_existing_user = await registerModel.findOne({
            email: req.body.email,
        });
        if (!find_existing_user) {
            await otpModel.deleteMany({
                email: req.body.email,
                type: "verify",
            });
            return res.status(400).send({
                status: 400,
                success: false,
                Message: "Invalid User",
            });
        }
        var otp = await userAuth.generateOtp();
        let found = await otpModel.findOne({
            email: req.body.email,
            type: "verify",
        });
        var encrypt = function (plain_text, encryptionMethod, secret, iv) {
            var encryptor = crypto.createCipheriv(encryptionMethod, secret, iv);
            return encryptor.update(plain_text, "utf8", "base64") + encryptor.final("base64");
        };
        var encryptionMethod = "AES-256-CBC";
        var secret = "My32charPasswordAndInitVectorStr"; //must be 32 char length
        var iv = process.env.otp_secret.substr(0, 16);
        var encryptedMessage = encrypt(otp.toString(), encryptionMethod, process.env.otp_secret, iv);
        var crypto_otp = crypto.createHash("sha256").update(otp.toString()).digest("hex");
        let reset_otp = {
            emailVerificationOtpExpires: Date.now() + 3 * 60 * 1000,
            otp: crypto_otp,
        };
        if (!found) {
            console.log("here");
            await otpModel.create({
                email: req.body.email,
                otp: reset_otp.otp,
                type: "verify",
                expireAt: reset_otp.emailVerificationOtpExpires,
                attempt: 1,
                nextAttempt: Date.now() + 2 * 60 * 1000,
            });
        }
        if (found) {
            if (found.attempt < 2) {
                console.log(found.attempt < 2);
                if (Date.now() < new Date(found.nextAttempt).getTime()) {
                    console.log("Date");
                    let timeLeft = format(
                        (new Date(found.nextAttempt).getTime() - new Date(Date.now()).getTime()) / 1000
                    );
                    return res.status(400).send({
                        status: 400,
                        success: false,
                        timeLeft: timeLeft,
                        Message: `Please try in ${timeLeft} minutes`,
                    });
                } else {
                    let count = found.attempt + 1;
                    found = await otpModel.findOneAndUpdate(
                        {
                            email: req.body.email,
                            type: "verify",
                        },
                        {
                            otp: reset_otp.otp,
                            expireAt: reset_otp.emailVerificationOtpExpires,
                            attempt: count,
                            nextAttempt: Date.now() + 2 * 60 * 1000,
                        },
                        { new: true }
                    );
                }
            } else if (found.attempt === 2) {
                console.log(found.attempt);
                if (Date.now() < new Date(found.nextAttempt).getTime()) {
                    let timeLeft = format(
                        (new Date(found.nextAttempt).getTime() - new Date(Date.now()).getTime()) / 1000
                    );
                    return res.status(400).send({
                        status: 400,
                        success: false,
                        timeLeft: timeLeft,
                        Message: `Please try in ${timeLeft} minutes`,
                    });
                } else {
                    let count = found.attempt + 1;
                    console.log(count);
                    found = await otpModel.findOneAndUpdate(
                        {
                            email: req.body.email,
                            type: "verify",
                        },
                        {
                            otp: reset_otp.otp,
                            expireAt: reset_otp.emailVerificationOtpExpires,
                            attempt: count,
                            nextAttempt: Date.now() + 20 * 60 * 1000,
                        },
                        { new: true }
                    );
                }
            } else if (found.attempt === 3) {
                if (Date.now() < new Date(found.nextAttempt).getTime()) {
                    let timeLeft = format(
                        (new Date(found.nextAttempt).getTime() - new Date(Date.now()).getTime()) / 1000
                    );
                    return res.status(400).send({
                        status: 400,
                        success: false,
                        lastAttempt: true,
                        timeLeft: timeLeft,
                        Message: `Please try in ${timeLeft} minutes`,
                    });
                } else {
                    found = await otpModel.findOneAndUpdate(
                        {
                            email: req.body.email,
                            type: "verify",
                        },
                        {
                            otp: reset_otp.otp,
                            expireAt: reset_otp.emailVerificationOtpExpires,
                            attempt: 1,
                            nextAttempt: Date.now() + 2 * 60 * 1000,
                        },
                        { new: true }
                    );
                }
            }
        }
        //findOneAndRemove
        await registerModel.findOneAndUpdate({ email: req.body.email }, reset_otp, {
            new: true,
        });
        res.status(200).send({
            status: 200,
            success: true,
            otp: encryptedMessage,
            attemptsLeft: 3 - (found ? found.attempt : 1),
        });
    } catch (e) {
        console.log(e);
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to send otp",
        });
    }
};
const userDetails = async (req, res) => {
    const email = req.body.email;
    const exist = await registerModel.findOne({
        email: email.toLowerCase(),
        isverified: false,
    });
    if (exist) {
        return res.status(400).send({
            status: 400,
            success: false,
            Error: "notverified",
        });
    }
    const web3 = new Web3(process.env.JSON_RPC_SOCKET);
    let tokenAddress = process.env.MAIN_CONTRACT_ADDRESS;
    var abiArray = JSON.parse(fs.readFileSync("updatedabi.json", "utf-8"));
    var instance = new web3.eth.Contract(abiArray, tokenAddress);

    try {
        var user = await User.find({ email: email.toLowerCase() });
        const [response] = user;
        var token = await jwt.sign({ id: email.toLowerCase(), address: response.address }, process.env.secret, {
            expiresIn: 3600, // expires in 24 hours
        });
        req.session.jwt = token;
        var password = crypto.createHash("sha256").update(req.body.password).digest("hex");

        let result = await instance.methods
            .getuserDetails(response.address, password)
            .call({ from: process.env.ADMIN_ADDRESS });
        res.status(200).send({
            status: 200,
            success: true,
            User: {
                address: result[0],
                firstName: result[1],
                lastName: result[2],
                email: result[4],
                token: token,
            },
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Error: "Please Check Your Email Or Password",
        });
    }
};

var createContract = async (req, res) => {
    try {
        var value = req.user;
        //var date_res = await date_validation.date_verificaion(req.body.date);
        var today = new Date();
        var date = String(today.getMonth() + 1) + "/" + String(today.getDate()) + "/" + String(today.getFullYear());
        var today1 = new Date(date);
        const d = new Date(req.body.date);
        let text =
            (d.getMonth() > 8 ? d.getMonth() + 1 : "0" + (d.getMonth() + 1)) +
            "/" +
            (d.getDate() > 9 ? d.getDate() : "0" + d.getDate()) +
            "/" +
            d.getFullYear();
        //let text = d.toLocaleDateString();
        if (d.getTime() < today1.getTime() || text == "Invalid Date" || req.body.date == undefined) {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Please select correct date",
            });
            return;
        }
        console.log(req.body);
        var approver_status = undefined;
        var third_party_approver = undefined;
        if (req.body.approver) {
            approver_status = false;
            third_party_approver = false;
        } else {
            approver_status = false;
        }
        // if (!['BUSD', 'BNB'].includes(req.body.symbol)) {
        if (!["BNB", "CTY"].includes(req.body.coin)) {
            var total_Eth = await checkBalance.getEthBalance(value.address);
            console.log(total_Eth);
            var gasOnHold = await checkBalance.contract_holding_gas(value.address);
            console.log(gasOnHold);
            var gasFee = await checkBalance.gasFees();
        } else {
            var total_Eth = await checkBalance.getBNBBalance(value.address);
            console.log(total_Eth);
            var gasOnHold = await checkBalance.contract_holding_gas_BNB(value.address);
            console.log(gasOnHold);
            var gasFee = await checkBalance.gasFeesBnb();
            console.log(gasFee);
        }
        if (total_Eth - gasOnHold < gasFee) {
            return res.status(400).send({
                success: false,
                status: 400,
                Message: "Gas is not enough to create contract for schedule transaction",
            });
        }
        var contract = await Contract.find({ Transfer: value.address });
        if (!["BUSD", "USDC", "USDT", "ETH", "BNB", "PAX", "CTY"].includes(req.body.symbol)) {
            res.status(406).send({
                success: false,
                status: 406,
                Message: "Invalid Token or Currency!",
            });
            return;
        }

        var amount = await checkBalance.contract_holding_amount(value.address, req.body.symbol);
        let web = new Web3(process.env.ETH_LINK);
        const web3Busd = new Web3(process.env.ETH_LINK);
        const web3BNB = new Web3(process.env.BNB_LINK);
        let tokenAddress;
        var abiArray;
        if (req.body.amount <= 0) {
            return res.status(400).send({
                status: 400,
                success: false,
                Message: "contract amount can`t be 0",
            });
        }
        if (req.body.amount >= 500) {
            req.body.adminFee = (req.body.amount / 100) * 5;
            console.log(Number(req.body.amount) + Number(req.body.adminFee));
        } else {
            req.body.adminFee = 0;
        }
        if (req.body.symbol == "BUSD") {
            tokenAddress = process.env.busd_contract_address;
            abiArray = JSON.parse(fs.readFileSync("busd.json", "utf-8"));
            var schedule_amount = await web3Busd.utils.toWei(
                `${Number(req.body.amount) + Number(req.body.adminFee)}`,
                "ether"
            );
            var instance = new web3Busd.eth.Contract(abiArray, tokenAddress);
            var user_token = await instance.methods.balanceOf(value.address).call();
            var eth_balance = await web3Busd.eth.getBalance(value.address);
            var balance = await web3Busd.utils.fromWei(eth_balance, "ether");
        } else if (req.body.symbol == "CTY") {
            tokenAddress = process.env.cty_contract_address;
            abiArray = JSON.parse(fs.readFileSync("busd.json", "utf-8"));
            var schedule_amount = await web3BNB.utils.toWei(
                `${Number(req.body.amount) + Number(req.body.adminFee)}`,
                "ether"
            );
            var instance = new web3BNB.eth.Contract(abiArray, tokenAddress);
            var user_token = await instance.methods.balanceOf(value.address).call();
            var eth_balance = await web3BNB.eth.getBalance(value.address);
            var balance = await web3BNB.utils.fromWei(eth_balance, "ether");
        } else if (req.body.symbol == "BNB") {
            var schedule_amount = await web3BNB.utils.toWei(
                `${Number(req.body.amount) + Number(req.body.adminFee)}`,
                "ether"
            );
            var eth_balance = await web3BNB.eth.getBalance(value.address);
            var balance = await web3BNB.utils.fromWei(eth_balance, "ether");
            var user_token = eth_balance;
        } else if (req.body.symbol == "ETH") {
            var schedule_amount = await web.utils.toWei(
                `${Number(req.body.amount) + Number(req.body.adminFee)}`,
                "ether"
            );
            var eth_balance = await web.eth.getBalance(value.address);
            var balance = await web.utils.fromWei(eth_balance, "ether");
            var user_token = eth_balance;
        } else if (req.body.symbol == "PAX") {
            tokenAddress = process.env.pax_contract_address;
            abiArray = JSON.parse(fs.readFileSync("usdt.json", "utf-8"));
            var schedule_amount = await web.utils.toWei(
                `${Number(req.body.amount) + Number(req.body.adminFee)}`,
                "ether"
            );
            var instance = new web.eth.Contract(abiArray, tokenAddress);
            var user_token = await instance.methods.balanceOf(value.address).call();
            var eth_balance = await web.eth.getBalance(value.address);
            var balance = await web.utils.fromWei(eth_balance, "ether");
        } else if (req.body.symbol == "USDT") {
            tokenAddress = process.env.usdt_contract_address;
            abiArray = JSON.parse(fs.readFileSync("usdt.json", "utf-8"));
            var schedule_amount = await web.utils.toWei(
                `${Number(req.body.amount) + Number(req.body.adminFee)}`,
                "mwei"
            );
            var instance = new web.eth.Contract(abiArray, tokenAddress);
            var user_token = await instance.methods.balanceOf(value.address).call();
            var eth_balance = await web.eth.getBalance(value.address);
            var balance = await web.utils.fromWei(eth_balance, "ether");
        } else if (req.body.symbol == "USDC") {
            tokenAddress = process.env.usdc_contract_address;
            abiArray = JSON.parse(fs.readFileSync("usdc.json", "utf-8"));
            var schedule_amount = await web.utils.toWei(
                `${Number(req.body.amount) + Number(req.body.adminFee)}`,
                "mwei"
            );
            var instance = new web.eth.Contract(abiArray, tokenAddress);
            var user_token = await instance.methods.balanceOf(value.address).call();
            var eth_balance = await web.eth.getBalance(value.address);
            var balance = await web.utils.fromWei(eth_balance, "ether");
        }
        if (!req.body.approver) {
            req.body.approver = req.body.beneficiary;
        }
        if (balance == 0) {
            return res.status(400).send({
                status: 400,
                success: false,
                Message: "Not Enough Gas to create contract",
            });
        }
        console.log(user_token, parseInt(schedule_amount), parseInt(amount));
        if (user_token < parseInt(schedule_amount) + parseInt(amount)) {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Insufficient Fund!",
            });
        } else {
            if (req.body.symbol == "CTY") {
                if (user_token < parseInt(schedule_amount) + parseInt(amount) + process.env.cty_fee) {
                    return res.status(400).send({
                        status: 400,
                        success: false,
                        Message: "Insufficient Fund!",
                    });
                }
            }
            const recepit = await send_cty_to_admin(req.user);
            console.log(recepit);
            if (!recepit.status) {
                return res.status(400).send({
                    status: 400,
                    success: false,
                    Message: "Gas fees transfer failed",
                });
            }
            const web3 = new Web3(process.env.JSON_RPC_SOCKET);
            var data = new Contract();
            data.Name = req.body.name;
            data.Amount = req.body.amount;
            data.Transfer = value.address;
            data.Beneficiary = req.body.beneficiary;
            data.adminFee = req.body.adminFee;
            data.Date = text;
            data.onHoldGas = gasFee;
            data.Approver = req.body.approver;
            data.Symbol = req.body.symbol;
            // data.FileName = filesArray;
            data.FileName = req.body.files;
            data.transaction_approved = approver_status;
            data.third_party_approver = third_party_approver;
            data.type = "contract";
            data.status = "Waiting";
            data.Pending = true;
            if (!web3.utils.isAddress(data.Transfer) || !web3.utils.isAddress(data.Beneficiary)) {
                res.status(406).send({
                    success: false,
                    status: 406,
                    Message: "One or more Invalid Address!",
                });
                return;
            }
            if (!(req.body.approver === undefined)) {
                if (!web3.utils.isAddress(req.body.approver)) {
                    return res.status(406).send({
                        success: false,
                        status: 406,
                        Message: "Invalid Approver Address!",
                    });
                }
            }
            var [transferAddress] = await User.find({ address: data.Transfer });
            var [beneficiaryAddress] = await User.find({
                address: data.Beneficiary,
            });
            var [approverAddress] = await User.find({ address: data.Approver });

            if (transferAddress === undefined) {
                res.status(406).send({
                    success: false,
                    status: 406,
                    Message: "One or more addresses not available!",
                });
                return;
            }
            if (!(req.body.approver === undefined)) {
                if (approverAddress === undefined) {
                    res.status(406).send({
                        success: false,
                        status: 406,
                        Message: "Approver addresses not available!",
                    });
                    return;
                }
            }

            try {
                const result = await addContract(
                    data._id,
                    data.Amount,
                    data.Transfer,
                    data.Beneficiary,
                    data.Date,
                    data.Approver,
                    data.status
                );
                console.log(result.transactionHash, data._id);
                data.hash = result.transactionHash;
                // const resData=await Contract.findByIdAndUpdate(data._id,{hash:result.transactionHash},{new:true})
                await data.save();
                const today = new Date();
                const date = dateFormat(today);
                console.log(date);
                var found = await Contract.findOne({
                    _id: data._id,
                    Date: date,
                    Pending: true,
                    third_party_approver: undefined,
                });
                console.log(found);
                if (found) {
                    await makeSingleTransaction(found);
                }
                //console.log(result[0])
                res.status(200).send({
                    success: true,
                    status: 200,
                    data: data,
                });
            } catch (e) {
                console.log(e);
                res.status(400).send({
                    success: false,
                    status: 400,
                    Message: e.message,
                });
            }
        }
    } catch (e) {
        console.log(e);
        return res.status(400).send({
            status: 400,
            success: false,
            Message: "Invalid Inputs!",
        });
    }
};

var forgot_Password = async (req, res) => {
    var otp = await userAuth.generateOtp();
    var encrypt = function (plain_text, encryptionMethod, secret, iv) {
        var encryptor = crypto.createCipheriv(encryptionMethod, secret, iv);
        return encryptor.update(plain_text, "utf8", "base64") + encryptor.final("base64");
    };
    var encryptionMethod = "AES-256-CBC";
    var secret = "My32charPasswordAndInitVectorStr"; //must be 32 char length
    var iv = process.env.otp_secret.substr(0, 16);
    var encryptedMessage = encrypt(otp.toString(), encryptionMethod, process.env.otp_secret, iv);
    const email = req.body.email;
    var find_existing_user = await otpModel.findOne({
        email: email.toLowerCase(),
        type: "password-reset",
    });
    if (find_existing_user) {
        find_existing_user.otp = crypto.createHash("sha256").update(otp.toString()).digest("hex");
        find_existing_user.expireAt = Date.now() + 3 * 60 * 1000;
        if (find_existing_user.attempt < 2) {
            if (Date.now() < new Date(find_existing_user.nextAttempt).getTime()) {
                let timeLeft = format(
                    (new Date(find_existing_user.nextAttempt).getTime() - new Date(Date.now()).getTime()) / 1000
                );
                return res.status(400).send({
                    status: 400,
                    success: false,
                    timeLeft: timeLeft,
                    Message: `Please try in ${timeLeft} minutes`,
                });
            } else {
                find_existing_user.attempt = find_existing_user.attempt + 1;
                find_existing_user.nextAttempt = Date.now() + 2 * 60 * 1000;
                find_existing_user = await find_existing_user.save();
            }
        } else if (find_existing_user.attempt === 2) {
            if (Date.now() < new Date(find_existing_user.nextAttempt)) {
                let timeLeft = format(
                    (new Date(find_existing_user.nextAttempt).getTime() - new Date(Date.now()).getTime()) / 1000
                );
                return res.status(400).send({
                    status: 400,
                    success: false,
                    timeLeft: timeLeft,
                    Message: `Please try in ${timeLeft} minutes`,
                });
            } else {
                find_existing_user.attempt = find_existing_user.attempt + 1;
                find_existing_user.nextAttempt = Date.now() + 20 * 60 * 1000;
                find_existing_user = await find_existing_user.save();
            }
        } else if (find_existing_user.attempt === 3) {
            if (Date.now() < new Date(find_existing_user.nextAttempt)) {
                let timeLeft = format(
                    (new Date(find_existing_user.nextAttempt).getTime() - new Date(Date.now()).getTime()) / 1000
                );
                return res.status(400).send({
                    status: 400,
                    success: false,
                    lastAttempt: true,
                    timeLeft: timeLeft,
                    Message: `Please try in ${timeLeft} minutes`,
                });
            } else {
                find_existing_user.attempt = 1;
                find_existing_user.nextAttempt = Date.now() + 2 * 60 * 1000;
                find_existing_user = await find_existing_user.save();
            }
        }
        console.log(find_existing_user);
        return res.status(200).send({
            status: 200,
            success: true,
            otp: encryptedMessage,
            attemptsLeft: 3 - find_existing_user.attempt,
        });
    }
    if (!validator.isEmail(req.body.email)) {
        return res.status(400).send({
            status: 400,
            success: false,
            Message: "Please Enter Correct Email",
        });
    }

    try {
        var user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            var _otp = crypto.createHash("sha256").update(otp.toString()).digest("hex");
            const newUser = await otpModel.create({
                email: email.toLowerCase(),
                otp: _otp,
                expireAt: Date.now() + 3 * 60 * 1000,
                type: "password-reset",
                attempt: 1,
                nextAttempt: Date.now() + 2 * 60 * 1000,
            });
            return res.status(200).send({
                status: 200,
                success: true,
                otp: encryptedMessage,
                attemptsLeft: 3 - 1,
            });
        } else {
            return res.status(400).send({
                status: 400,
                success: false,
                Message: "Invalid User",
            });
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Invalid User",
        });
    }
};
var varify_password_otp = async (req, res) => {
    try {
        var newUser = await otpModel.findOne({
            email: req.body.email.toLowerCase(),
            type: "password-reset",
        });
        if (!newUser) {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Invalid Otp",
            });
            return;
        }
        var otp = crypto.createHash("sha256").update(req.body.otp.toString()).digest("hex");

        if (otp == newUser.otp && newUser.expireAt > Date.now()) {
            res.status(200).send({
                status: 200,
                success: true,
                Message: "verified",
            });
        } else if (newUser.expireAt < Date.now()) {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Otp Expired! Please reset otp",
            });
        } else {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Invalid Otp",
            });
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Invalid Otp",
        });
    }
};
var reset_Password = async (req, res) => {
    try {
        var regularExpression = Regex.password;
        var password = req.body.password;
        if (!regularExpression.test(password)) {
            res.status(400).send({
                status: 400,
                success: false,
                Message:
                    "Password at least one uppercase letter, one lowercase letter and one number and one special character and minimum 8 character",
            });
            return;
        }
        var newUser = await otpModel.findOne({
            email: req.body.email.toLowerCase(),
            type: "password-reset",
        });
        if (!newUser) {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Failed to change password",
            });
            return;
        }
        var otp = crypto.createHash("sha256").update(req.body.otp.toString()).digest("hex");

        var password = crypto.createHash("sha256").update(req.body.password).digest("hex");

        if (otp == newUser.otp && newUser.expireAt > Date.now()) {
            var status = await resetPassword(newUser.email, password);
            if (status) {
                await otpModel.findOneAndRemove({
                    email: req.body.email.toLowerCase(),
                });
                res.status(200).send({
                    status: 200,
                    success: true,
                    Message: "Password reset Successfully",
                });
            } else {
                res.status(400).send({
                    status: 400,
                    success: false,
                    Message: "Password reset failed",
                });
            }
        } else if (newUser.expireAt < Date.now()) {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Otp Expired! Please reset otp",
            });
        } else {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Password reset failed",
            });
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Password reset failed",
        });
    }
};
var change_Password = async (req, res) => {
    console.log("hello");
    console.log(req.body);
    if (!req.body.password || !req.body.newPassword) {
        return res.status(400).send({
            status: 400,
            success: false,
            Message: "Invalid Email or Password first",
        });
    }
    var regularExpression = Regex.password;
    var password = req.body.password;
    if (!regularExpression.test(password) && regularExpression.test(req.body.newPassword)) {
        res.status(400).send({
            status: 400,
            success: false,
            Message:
                "Password at least one uppercase letter, one lowercase letter and one number and one special character and minimum 8 character",
        });
        return;
    }
    try {
        var value = req.user;
        var newUser = await User.findOne({
            email: value.email,
        });

        if (!newUser) {
            return res.status(400).send({
                status: 400,
                success: false,
                Message: "Invalid Email or Password",
            });
        } else {
            var password = crypto.createHash("sha256").update(req.body.password).digest("hex");
            var newPassword = crypto.createHash("sha256").update(req.body.newPassword).digest("hex");
            var status = await changePassword(newUser.email, password, newPassword);
            if (status) {
                await registerModel.findOneAndRemove({
                    email: value.email,
                    isPasswordAuth: true,
                });
                // const recepit = await send_cty_to_admin(req.user);
                // console.log(recepit);
                // if (!recepit.status) {
                // 	return res.status(400).send({
                // 		status: 400,
                // 		success: false,
                // 		response: 'Gas fees transfer failed',
                // 	});
                // }
                return res.status(200).send({
                    status: 200,
                    success: true,
                    Message: "Password changed Successfully",
                });
            } else {
                return res.status(400).send({
                    status: 400,
                    success: false,
                    Message: "Invalid Email or Password",
                });
            }
        }
    } catch (e) {
        return res.status(400).send({
            status: 400,
            success: false,
            Message: "Invalid Email or Password",
        });
    }
};

var get_Contracts = async (req, res) => {
    try {
        var value = req.user;
        var user = await User.find({ email: value.email });
        if (user.length == 0) {
            return res.status(400).send({
                status: 400,
                success: false,
                Error: "Invalid User",
            });
        }
        var completed = await getContracts.getCompletedInfo(value.email, req.body.limit, req.body.skip);

        if (completed.success === true) {
            return res.status(200).send({
                status: 200,
                History: completed,
            });
        } else {
            return res.status(200).send({
                status: 204,
                History: completed,
            });
        }
    } catch (e) {
        return res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to find Contracts",
        });
    }
};

var getPendingContracts = async (req, res) => {
    try {
        var user = await User.find({ email: req.user.email });
        if (user.length == 0) {
            res.status(400).send({
                status: 400,
                success: false,
                Error: "Invalid Email or Password",
            });
            return;
        }
        var waiting = await getContracts.getWaitingInfo(req.user.email);

        if (waiting.success === true) {
            res.status(200).send({
                status: 200,
                Waiting: waiting,
            });
        } else {
            res.status(200).send({
                status: 204,
                Waiting: waiting,
            });
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to find Contracts",
        });
    }
};

var getCompletedContracts = async (req, res) => {
    try {
        var user = await User.findOne({ email: req.user.email });
        if (!user) {
            res.status(400).send({
                status: 400,
                success: false,
                Error: "Invalid User",
            });
            return;
        }
        var completed = await getContracts.getCompletedInfo(req.user.email);

        if (completed.success === true) {
            res.status(200).send({
                status: 200,
                Completed: completed,
            });
        } else {
            res.status(204).send({
                status: 204,
                Completed: completed,
            });
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Failed to find Contracts",
        });
    }
};

var getOneTransaction = async (req, res) => {
    try {
        var value = req.user;
        var user = await User.find({ email: value.email });
        if (user.length == 0) {
            res.status(400).send({
                status: 400,
                success: false,
                Error: "Invalid User",
            });
        }
        if (!req.params.id) {
            return res.status(400).send({
                status: 400,
                success: false,
                Error: "Enter transaction hash please",
            });
        }
        var transaction = await Contract.findOne({
            _id: req.params.id,
            $or: [{ Transfer: user[0].address }, { Beneficiary: user[0].address }, { Approver: user[0].address }],
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
            trans = await Contract.aggregate(withapprover(req.params.id));
        } else {
            trans = await Contract.aggregate(withNoapprover(req.params.id));
        }
        return res.status(200).send({
            status: 200,
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

var usdc = async (req, res) => {
    try {
        var response = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=USDC");
        var [data] = response.data.data;
        var usdc_price = data.price;
        var usdc = req.body.usd / usdc_price;

        res.send({
            usdc,
        });
    } catch (e) {
        res.status(404).send({
            success: false,
            status: 404,
            Error: "Conversion Failed",
        });
    }
};

var usdt = async (req, res) => {
    try {
        var response = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=USDT");
        var [data] = response.data.data;
        var usdt_price = data.price;
        var usdt = req.body.usd / usdt_price;

        res.send({
            usdt,
        });
    } catch (e) {
        res.status(404).send({
            success: false,
            status: 404,
            Error: "Conversion Failed",
        });
    }
};

var busd = async (req, res) => {
    try {
        var response = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=BUSD");
        var [data] = response.data.data;
        var busd_price = data.price;
        var busd = req.body.usd / busd_price;

        res.send({
            busd,
        });
    } catch (e) {
        res.status(404).send({
            success: false,
            status: 404,
            Error: "Conversion Failed",
        });
    }
};

var cty = async (req, res) => {
    try {
        var response = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=BUSD");
        var [data] = response.data.data;
        var cty_price = data.price;
        var cty = req.body.usd / cty_price;

        res.send({
            cty,
        });
    } catch (e) {
        res.status(404).send({
            success: false,
            status: 404,
            Error: "Conversion Failed",
        });
    }
};

var eth = async (req, res) => {
    try {
        var response = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=ETH");
        var [data] = response.data.data;
        var eth_price = data.price;
        var eth = req.body.usd / eth_price;

        res.send({
            eth,
        });
    } catch (e) {
        res.status(404).send({
            success: false,
            status: 404,
            Error: "Conversion Failed",
        });
    }
};

var bnb = async (req, res) => {
    try {
        var response = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=BNB");
        var [data] = response.data.data;
        var bnb_price = data.price;
        var bnb = req.body.usd / bnb_price;

        res.send({
            bnb,
        });
    } catch (e) {
        res.status(404).send({
            success: false,
            status: 404,
            Error: "Conversion Failed",
        });
    }
};

var pax = async (req, res) => {
    try {
        var response = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=PAX");
        var [data] = response.data.data;
        var pax_price = data.price;
        var pax = req.body.usd / pax_price;
        res.send({
            pax,
        });
    } catch (e) {
        res.status(404).send({
            success: false,
            status: 404,
            Error: "Conversion Failed",
        });
    }
};

var user_address = async (req, res) => {
    try {
        var value = req.user;
        var user = await User.find({ email: value.email });
        var [response] = user;
        res.status(200).send({
            success: true,
            status: 200,
            address: response.address,
        });
    } catch (e) {
        res.status(400).send({
            success: false,
            status: 400,
            Error: "Invalid User",
        });
    }
};
var contract_amount = async (req, res) => {
    try {
        var value = req.user;
        var user = await User.find({ email: value.email });
        if (user.length == 0) {
            res.status(400).send({
                status: 400,
                success: false,
                Error: "Invalid User",
            });
            return;
        }
        var [response] = user;
        if (response.address) {
            var contract_usdc = await checkBalance.contract_amount(response.address, "USDC");
            var contract_usdt = await checkBalance.contract_amount(response.address, "USDT");
            var contract_pax = await checkBalance.contract_amount(response.address, "PAX");
            var contract_busd = await checkBalance.contract_amount(response.address, "BUSD");
            var contract_bnb = await checkBalance.contract_amount(response.address, "BNB");
            var contract_cty = await checkBalance.contract_amount(response.address, "CTY");
            var contract_eth = await checkBalance.contract_amount(response.address, "ETH");
            var usd_per_usdc = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=USDC");
            var usd_per_usdt = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=USDT");
            var usd_per_pax = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=PAX");
            var usd_per_busd = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=BUSD");
            var usd_per_eth = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=ETH");
            var usd_per_bnb = await axios("https://api.lunarcrush.com/v2?data=assets&symbol=BNB");
            var [_usdc] = usd_per_usdc.data.data;
            var [_usdt] = usd_per_usdt.data.data;
            var [_pax] = usd_per_pax.data.data;
            var [_busd] = usd_per_busd.data.data;
            var [_eth] = usd_per_eth.data.data;
            var [_bnb] = usd_per_bnb.data.data;
            var c_amount =
                contract_pax * _pax.price +
                contract_usdc * _usdc.price +
                contract_usdt * _usdt.price +
                contract_busd * _busd.price +
                contract_cty * _busd.price +
                contract_eth * _eth.price +
                contract_bnb * _bnb.price;
            res.status(200).send({
                success: true,
                status: 200,
                amount: c_amount,
            });
        } else {
            res.status(400).send({
                success: false,
                status: 400,
                Message: "No Contract Found",
            });
        }
    } catch (e) {
        res.status(400).send({
            success: false,
            status: 400,
            Error: "No Contract Found",
        });
    }
};
var send_amount = async (req, res) => {
    try {
        var value = req.user;
        var user = await User.find({ email: value.email });
        if (user.length == 0) {
            res.status(400).send({
                status: 400,
                success: false,
                Error: "Invalid User",
            });
            return;
        }
        var [response] = user;
        if (response.address) {
            var send_amount = await checkBalance.send_usd(response.address);
            res.status(200).send({
                success: true,
                status: 200,
                amount: send_amount,
            });
        } else {
            res.status(400).send({
                success: false,
                status: 400,
                Message: "Something went wrong",
            });
        }
    } catch (e) {
        res.status(404).send({
            success: false,
            status: 404,
            Error: "Something went wrong",
        });
    }
};
var received_amount = async (req, res) => {
    try {
        var value = req.user;
        var user = await User.find({ email: value.email });
        if (user.length == 0) {
            res.status(400).send({
                status: 400,
                success: false,
                Error: "Invalid User",
            });
            return;
        }
        var [response] = user;
        if (response.address) {
            var received_amount = await checkBalance.received_usd(response.address);
            res.status(200).send({
                success: true,
                status: 200,
                amount: received_amount,
            });
        } else {
            res.status(400).send({
                success: false,
                status: 400,
                Message: "Something went wrong",
            });
        }
    } catch (e) {
        res.status(404).send({
            success: false,
            status: 404,
            Error: "Something went wrong",
        });
    }
};
const user_info = async (req, res) => {
    try {
        console.log(req.user);
        var user = await User.find({ email: req.user.email });
        if (user.length == 0) {
            res.status(400).send({
                status: 400,
                success: false,
                Error: "Invalid User",
            });
            return;
        }
        console.log(user);
        const [response] = user;
        res.status(200).send({
            status: 200,
            success: true,
            User: {
                address: response.address,
                email: response.email,
            },
        });
    } catch (e) {
        res.status(404).send({
            status: 404,
            success: false,
            Error: "Invalid User",
        });
    }
};
var user_transaction = async (req, res) => {
    try {
        var user = await Transaction_History.find({ sender: req.body.address });
        res.status(200).send({
            status: 200,
            success: true,
            history: user,
        });
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            history: "Something went wrong",
        });
    }
};
var approve = async (req, res) => {
    try {
        var a_status = await transaction_approve.Change_Approver_Status(req.user.id);
        if (a_status.success == true) {
            res.status(200).send({
                status: 200,
                response: a_status,
            });
        } else {
            res.status(400).send({
                status: 400,
                response: a_status,
            });
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Something went wrong",
        });
    }
};
var third_party_approve = async (req, res) => {
    try {
        var a_status = await transaction_approve.Change_third_party_Approver_Status(req.body.id, req.user.address);
        if (a_status.success == true) {
            const today = new Date();
            const date = dateFormat(today);
            var found = await Contract.findOne({
                _id: req.body.id,
                Date: date,
                Pending: true,
            });
            if (found) {
                await makeSingleTransaction(found);
            }
            return res.status(200).send({
                status: 200,
                response: a_status,
            });
        } else {
            return res.status(400).send({
                status: 400,
                response: a_status,
            });
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Something went wrong",
        });
    }
};

var third_party_reject = async (req, res) => {
    try {
        console.log(req.body.id, req.user._id);
        var found = await Contract.findOne({
            _id: req.body.id,
            Pending: true,
            third_party_approver: false,
            Approver: req.user.address,
        });
        console.log(found);
        if (found) {
            await rejectSingleTransaction(found);
            res.status(200).send({
                status: 200,
                success: true,
                Message: "Transaction Has Been Rejected",
            });
        } else {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Operation failed",
            });
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Something went wrong",
        });
    }
};
var Expire_Otp = async (req, res) => {
    try {
        var user = await otpModel.findOne({
            email: req.body.email,
            type: req.body.type,
        });
        if (user) {
            if (user.type === "verify") {
                var dt = new Date(Date.now());
                dt.setMinutes(dt.getMinutes() - 20);
                await otpModel.findOneAndUpdate(
                    { email: req.body.email, type: user.type },
                    { expireAt: dt },
                    { new: true }
                );
                await registerModel.findOneAndUpdate(
                    { email: req.body.email },
                    { emailVerificationOtpExpires: dt },
                    { new: true }
                );
                return res.status(200).send({
                    status: 200,
                    success: true,
                    Message: "otp Expired",
                });
            } else if (user.type === "password-reset") {
                var dt = new Date(Date.now());
                dt.setMinutes(dt.getMinutes() - 20);
                await otpModel.findOneAndUpdate(
                    { email: req.body.email, type: user.type },
                    { expireAt: dt },
                    { new: true }
                );
                return res.status(200).send({
                    status: 200,
                    success: true,
                    Message: "otp Expired",
                });
            }
        } else if (
            await registerModel.findOne({
                email: req.body.email,
                isverified: false,
            })
        ) {
            var dt = new Date(Date.now());
            dt.setMinutes(dt.getMinutes() - 20);
            console.log(dt);
            await registerModel.findOneAndUpdate(
                { email: req.body.email },
                { emailVerificationOtpExpires: dt },
                { new: true }
            );
            return res.status(200).send({
                status: 200,
                success: true,
                Message: "otp Expired",
            });
        } else {
            return res.status(400).send({
                status: 400,
                success: false,
                Message: "Invalid User",
            });
        }
    } catch (e) {
        console.log(e);
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Something went wrong",
        });
    }
};
var search = async (req, res) => {
    try {
        // var user = await User.findOne({ name: req.body.email });
        if (!req.body.name || req.body.name.length < 2) {
            return res.status(400).send({
                status: 400,
                success: false,
                Message: "Please enter atleast first 2 characters of name",
            });
        }
        var user = await User.find({
            name: new RegExp("^" + req.body.name, "i"),
        }).limit(10);
        var array = [];
        for (let x of user) {
            var data = {
                name: x.name,
                address: x.address,
            };
            array.push(data);
        }
        if (user) {
            return res.status(200).send({
                status: 200,
                success: true,
                user: array,
            });
        } else {
            res.status(400).send({
                status: 400,
                success: false,
                Message: "Invalid User",
            });
            return;
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: "Something went wrong",
        });
    }
};

cron.schedule("59 23 * * *", async function () {
    var today = new Date();
    await declineTransactions(today);
});

cron.schedule("01 00 * * *", async function () {
    var today = new Date();
    console.log(today);
    await makeTransactions(today);
    console.log("---------------------");
});

cron.schedule("0 * * * *", async function () {
    console.log("---------Start------------");
    await sendAdminToBtc();
    await btcToUser();
    await sendAdminToUSD();
    await usdToUser();
    console.log("---------End------------");
});

module.exports = {
    register,
    userDetails,
    createContract,
    forgot_Password,
    reset_Password,
    get_Contracts,
    getPendingContracts,
    getCompletedContracts,
    getOneTransaction,
    usdc,
    usdt,
    busd,
    pax,
    bnb,
    cty,
    eth,
    user_address,
    third_party_reject,
    contract_amount,
    send_amount,
    received_amount,
    user_info,
    user_transaction,
    approve,
    third_party_approve,
    varifyOtp,
    change_Password,
    resendOtp,
    varify_password_otp,
    Expire_Otp,
    search,
};
