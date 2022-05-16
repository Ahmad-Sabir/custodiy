var jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    let token;
    if (req.headers['x-access-token']) {
        token = req.headers['x-access-token'];
        console.log(token);
    } else if (req.session.jwt) {
        token = req.session.jwt;
        console.log(token);
    }
    if (!token)
        return res
            .status(401)
            .send({ status: 400, success: false, message: 'Failed to authenticate' });
    try {
        let value = await jwt.verify(token, process.env.secret);
        var record = await User.findOne({ email: value.id });
        if (!record) {
            return res.status(400).send({
                status: 400,
                success: false,
                Message: 'Failed to authenticate',
            });
        } else {
            req.user = record;
            return next();
        }
    } catch (e) {
        res.status(400).send({
            status: 400,
            success: false,
            Message: 'Failed to authenticate',
        });
    }
};
