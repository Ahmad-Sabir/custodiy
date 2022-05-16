const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
var crypto = require('crypto');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema(
    {
        id: ObjectId,
        email: {
            type: String,
            required: true,
        },
        expireAt: Date,
        otp: {
            type: String,
        },
        type: {
            type: String,
            enum: {
                values: ['verify', 'password-reset'],
                message: ' Must be verify or password-reset',
            },
            required: [true, 'type is required'],
        },
        attempt: {
            type: Number,
        },
        nextAttempt: Date,
    },
    {
        timestamps: true,
    }
);
// userSchema.pre("save", async function (next) {
// 	//   const secret = 'abcdefg';
// 	this.otp = await crypto.createHash("sha256").update(this.otp).digest("hex");
// 	this.emailVerificationOtpExpires = Date.now() + 10 * 60 * 1000;
// 	next();
// });

const register = mongoose.model('otp', userSchema);
module.exports = register;
