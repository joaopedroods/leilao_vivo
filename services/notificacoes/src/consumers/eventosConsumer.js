const amqp = require('amqplib');
require('dotenv').config();
const { processarEvento } = require('../services/processarEvento');

async function iniciarConsumidor() {
  const conexao = await amqp.connect(process.env.RABBITMQ_URL);
  const canal = await conexao.createChannel();

  const fila = process.env.RABBITMQ_QUEUE;
  await canal.assertQueue(fila, { durable: true });

  canal.prefetch(1);

  console.log(`[rabbitmq] aguardando eventos na fila "${fila}"...`);

  canal.consume(fila, async (msg) => {
    if (!msg) return;

    try {
      const conteudo = JSON.parse(msg.content.toString());
      console.log(`[rabbitmq] evento recebido: ${conteudo.evento}`);

      await processarEvento(conteudo);

      canal.ack(msg);
    } catch (err) {
      console.error('[rabbitmq] erro ao processar mensagem:', err.message);
      canal.nack(msg, false, false);
    }
  });

  conexao.on('close', () => {
    console.error('[rabbitmq] conexao fechada. Reiniciando o servico vai reconectar.');
  });
}

module.exports = { iniciarConsumidor };
