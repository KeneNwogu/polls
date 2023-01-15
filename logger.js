const winston = require('winston')

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
)

const logger = winston.createLogger({
    format,
    transports: [
        new winston.transports.Console({ level: 'http' }),
        
    ]
})

module.exports = logger