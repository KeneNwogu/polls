const { Joi } = require('celebrate');

const PollOptionSerializer = Joi.object().keys({
    name: Joi.string().required()
})

const PollSerializer = Joi.object().keys({
    title: Joi.string().required(),
    options: Joi.array().items(PollOptionSerializer).required(),
    public: Joi.bool().required().default(true)
})

module.exports = {
    PollSerializer
}