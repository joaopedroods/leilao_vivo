require('dotenv').config();
const express = require('express');
const http = require('http'); // Adicionado
const { Server } = require('socket.io'); // Adicionado
const cors = require('cors');

const notificacoesRoutes = require('./routes/notificacoesRoutes');
const { iniciarConsumidor } = require('./consumers/eventosConsumer');

const app = express();
const server = http.createServer(app); // O Express agora roda dentro do servidor HTTP

// 1. Configuração do CORS da API
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 2. Configuração do WebSocket (Socket.io)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', servico: 'notificacoes' });
});

// 3. Rota na raiz para o NGINX rotear perfeitamente
app.use('/', notificacoesRoutes);

app.use((err, req, res, next) => {
  console.error('[erro nao tratado]', err);
  res.status(500).json({ erro: 'erro_interno' });
});

const PORT = process.env.PORT || 3003;

// ATENÇÃO: Aqui usamos server.listen no lugar de app.listen
server.listen(PORT, () => {
  console.log(`[notificacoes] rodando em http://localhost:${PORT}`);
});

// Passamos o 'io' para o consumidor, assim ele pode emitir eventos pro Front quando receber do RabbitMQ
iniciarConsumidor(io).catch((err) => {
  console.error('[rabbitmq] falha ao conectar, tentando de novo em 5s:', err.message);
  setTimeout(() => iniciarConsumidor(io), 5000);
});