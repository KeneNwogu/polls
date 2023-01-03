const { Joi } = require('celebrate');

const PollOptionSerializer = Joi.object().keys({
    name: Joi.string().required()
})

const PollSerializer = Joi.object().keys({
    title: Joi.string().required(),
    options: Joi.array().items(PollOptionSerializer).required()
})

module.exports = {
    PollSerializer
}