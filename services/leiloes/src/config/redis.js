const Redis = require('ioredis')
require('dotenv').config()

const redis = new Redis(process.env.REDIS_URL)

redis.on('connect', () => console.log('Redis conectado'))
redis.on('error', (err) => console.error('Erro no Redis:', err))

module.exports = redis