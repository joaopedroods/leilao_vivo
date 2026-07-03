require('dotenv').config();
const express = require('express');
const cors = require('cors');

const notificacoesRoutes = require('./routes/notificacoesRoutes');
const { iniciarConsumidor } = require('./consumers/eventosConsumer');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', servico: 'notificacoes' });
});

app.use('/notificacoes', notificacoesRoutes);

app.use((err, req, res, next) => {
  console.error('[erro nao tratado]', err);
  res.status(500).json({ erro: 'erro_interno' });
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`[notificacoes] rodando em http://localhost:${PORT}`);
});

iniciarConsumidor().catch((err) => {
  console.error('[rabbitmq] falha ao conectar, tentando de novo em 5s:', err.message);
  setTimeout(() => iniciarConsumidor(), 5000);
});
