const { Schema, model, Types } = require('mongoose');

const optionSchema = new Schema({
    votes: { type: Number },
    name: { type: String }
})

const pollSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    options: {
        type: [optionSchema]
    },
    public: {
        type: Boolean,
        default: true
    },
    user_id: {
        type: String
    }
})

const Poll = model('Poll', pollSchema)

module.exports = Poll