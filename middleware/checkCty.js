const checkBalance = require('../utility/checkBalance');
const checkCty = async (req, res, next) => {
    try {
        const cty = await checkBalance.cty_balance(req.user);
        console.log(cty);
        console.log(Number(cty), process.env.cty_fee, 'here');
        if (Number(cty) < Number(process.env.cty_fee)) {
            return res.status(400).send({
                status: 400,
                success: false,
                response: 'Insufficient $CTY to Pay Gas Fees For This Operation!',
            });
        }
        return next();
    } catch (e) {
        return res.status(400).send({
            status: 400,
            success: false,
            Message: 'Something Went Wrong',
        });
    }
};

module.exports = checkCty;
