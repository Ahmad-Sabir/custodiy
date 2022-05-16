const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
var crypto = require('crypto');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
    id: ObjectId,
    email: {
        type: String,
        lowercase: true,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    newPassword: {
        type: String,
    },
    emailVerificationOtpExpires: Date,
    isverified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
    },
});
// userSchema.pre("save", async function (next) {
// 	this.newPassword = await crypto
// 		.createHash("sha256")
// 		.update(this.newPassword)
// 		.digest("hex");
// 	next();
// });
userSchema.pre('save', async function (next) {
    this.password = await crypto.createHash('sha256').update(this.password).digest('hex');
    next();
});
userSchema.pre('save', async function (next) {
    //   const secret = 'abcdefg';
    this.otp = await crypto.createHash('sha256').update(this.otp).digest('hex');
    this.emailVerificationOtpExpires = Date.now() + 3 * 60 * 1000;
    next();
});

// userSchema.methods.correctPassword = async function (
// 	candidatePassword,
// 	userpassword
// ) {
// 	return await bcrypt.compare(candidatePassword, userpassword);
// };

const register = mongoose.model('register', userSchema);
module.exports = register;
