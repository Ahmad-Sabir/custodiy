const path = require("path");
const express = require("express");
const session = require("cookie-session");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
require("dotenv").config();
require("./utility/dbConn");
const app = express();
var userAuth = require("./utility/userAuth");
const checkSchedule = require("./controllers/scheduleController");
const routes = require("./routes/userRouter");
//console.log(process.env.ADMIN_ADDRESS)
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(
    session({
        signed: false,
    })
);
//Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

//data sanitization against xss
app.use(xss());
app.use(compression());

routes(app);
//2147483647
setInterval(userAuth.remove_from_otp, 1200000);
//setInterval(userAuth.remove_unvarified_user, 60000);
//setInterval(checkSchedule.makeTransactions, 120000);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
