const userController = require("../controllers/userController");
const websiteController = require("../controllers/websiteController");
const sendTokenController = require("../controllers/sendTokenController");
const middleware = require("../middleware/fileMiddleware");
const ipfsModule = require("../middleware/ipfs");
const withdrawcheck = require("../middleware/withDraw");
const marketController = require("../controllers/marketController");
const { withDrawCoins, getPayouts, getOnePayout } = require("../controllers/withdrawController");
const auth_user = require("../middleware/user_auth");
const checkCty = require("../middleware/checkCty");
module.exports = (app) => {
    app.post("/api/register", userController.register);
    app.post("/api/login", userController.userDetails);
    app.post("/api/createContract", auth_user, middleware, checkCty, ipfsModule, userController.createContract);
    app.post("/api/forgotPassword", userController.forgot_Password);
    app.post("/api/resetPassword", userController.reset_Password);
    app.get("/api/getContracts", auth_user, userController.get_Contracts);
    app.get("/api/getTransactionDetail/:id", auth_user, userController.getOneTransaction);
    app.get("/api/getCompletedContracts", auth_user, userController.getCompletedContracts);
    app.get("/api/getWaitingContracts", auth_user, userController.getPendingContracts);
    app.post("/api/USDC", userController.usdc);
    app.post("/api/USDT", userController.usdt);
    app.post("/api/BUSD", userController.busd);
    app.post("/api/PAX", userController.pax);
    app.post("/api/BNB", userController.bnb);
    app.post("/api/ETH", userController.eth);
    app.post("/api/CTY", userController.cty);
    app.post("/api/sendToken", auth_user, sendTokenController.sendToken);
    app.get("/api/userAddress", auth_user, userController.user_address);
    app.get("/api/contractAmount", auth_user, userController.contract_amount);
    app.get("/api/sentAmount", auth_user, userController.send_amount);
    app.get("/api/receivedAmount", auth_user, userController.received_amount);
    app.get("/api/eth_price", auth_user, marketController.get_eth_price);
    app.get("/api/bnb_price", auth_user, marketController.get_bnb_price);
    app.get("/api/USDC_price", auth_user, marketController.get_USDC_price);
    app.get("/api/USDT_price", auth_user, marketController.get_USDT_price);
    app.get("/api/CTY_price", auth_user, marketController.get_CTY_price);
    app.post("/api/conversion", marketController.conversion);
    app.get("/api/PAX_price", auth_user, marketController.get_PAX_price);
    app.get("/api/BUSD_price", auth_user, marketController.get_BUSD_price);
    app.get("/api/total_usd_balance", auth_user, marketController.total_usd_balance);
    app.get("/api/user_info", auth_user, userController.user_info);
    app.post("/api/approve_transaction", auth_user, userController.approve);
    app.post("/api/approve_third_party_transaction", auth_user, userController.third_party_approve);
    app.post("/api/reject_third_party_transaction", auth_user, userController.third_party_reject);
    app.post("/api/varifyOtp", userController.varifyOtp);
    app.post("/api/resendOtp", userController.resendOtp);
    app.post(
        "/api/changePassword",
        auth_user,
        middleware,
        //checkCty,
        userController.change_Password
    );
    app.post("/api/search_name", auth_user, userController.search);
    app.post("/api/varifyPasswordotp", userController.varify_password_otp);
    app.post("/api/Expire_Otp", userController.Expire_Otp);
    app.post("/api/withDraw", auth_user, middleware, checkCty, withdrawcheck, withDrawCoins);
    app.get("/api/getPayouts", auth_user, getPayouts);
    app.get("/api/getPayOut", auth_user, getOnePayout);

    app.get("/api/public/transactions", websiteController.get_Contracts);
    app.get("/api/public/transactions/:id", websiteController.getOneTransaction);
    app.get("/api/public/transactionStats", websiteController.transactionStat);
    app.get("/api/public/totalAccounts", websiteController.totalUsers);
    app.get("/api/public/totalBalance", websiteController.totalBalance);
    app.get("/api/public/contractStats", websiteController.contractDetails);
};
