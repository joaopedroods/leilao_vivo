const amqp = require('amqplib');
require('dotenv').config();
const { processarEvento } = require('../services/processarEvento');

// 1. Adicionamos a variável 'io' como parâmetro para receber do index.js
async function iniciarConsumidor(io) {
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

      // Salva no banco, tenta enviar e-mail, etc.
      await processarEvento(conteudo);

      // 2. O PULO DO GATO: Se o WebSocket estiver ativo, avisa o React!
      if (io) {
        // Define o ícone de acordo com o evento do RabbitMQ
        let tipoIcone = "bell"; 
        if (conteudo.evento === 'lance_superado') tipoIcone = "outbid";
        if (conteudo.evento === 'leilao_vencido' || conteudo.evento === 'leilao_encerrado') tipoIcone = "trophy";

        io.emit("nova_notificacao", {
          id: conteudo.notificacaoId || Date.now().toString(),
          tipo: tipoIcone,
          // Se o conteudo já vier com uma mensagem do backend de leilões, usa ela, senão põe um padrão
          mensagem: conteudo.mensagem || `Nova atualização no sistema: ${conteudo.evento}`
        });
        
        console.log(`[socket.io] Notificação enviada para o frontend: ${conteudo.evento}`);
      }

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