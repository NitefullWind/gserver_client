var redis = require('redis')
var config = require('./config');
var logger = require('./logger').getLogger("redis")

var redis_cli = redis.createClient(config.get('redis.port'), config.get('redis.host'))
redis_cli.auth(config.get('redis.password'), (err) => {
    if(err) {
        logger.error(err)
    } else {
        logger.debug("Connected to redis server successs!")
    }
})

module.exports = redis_cli;