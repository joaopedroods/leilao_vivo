const jwt = require('jsonwebtoken')
require('dotenv').config()

const token = jwt.sign(
  { userId: '123e4567-e89b-12d3-a456-426614174000' },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
)

console.log(token)