const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {type: String, required: true},
    role: {type: String, enum: ['admin', 'user'], default: 'user'},
    status: {type: String, enum: [true, false], default: false},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
}, {timestamps: true});

const User = mongoose.model('user', userSchema);

module.exports = User;