const { Schema, model, Types } = require('mongoose');

const userSchema = new Schema({
    
})

const User = model('User', userSchema);

module.exports = User;