const amqplib = require('amqplib')
require('dotenv').config()

let channel = null

async function conectar() {
  const conn = await amqplib.connect(process.env.RABBITMQ_URL)
  channel = await conn.createChannel()
  await channel.assertQueue('leilaovivo.eventos', { durable: true })
  console.log('RabbitMQ conectado')
}

async function publicar(evento) {
  if (!channel) throw new Error('RabbitMQ não conectado')
  channel.sendToQueue(
    'leilaovivo.eventos',
    Buffer.from(JSON.stringify(evento)),
    { persistent: true }
  )
}

module.exports = { conectar, publicar }