const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const redis = require('./config/redis');
const { conectar: conectarRabbitMQ } = require('./config/rabbitmq');

const app = express();
const server = http.createServer(app);

// Configuração do CORS para Express
app.use(cors({
  origin: 'http://localhost:5173', // Domínio do seu React
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Configuração do CORS para Socket.io
const io = new Server(server, { 
  cors: { 
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  } 
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servico: 'leiloes' });
});

// Importação das rotas
const leiloesRoutes = require('./routes/leiloes');
// Ajuste: como seu NGINX vai bater aqui via /api/leiloes/, 
// aqui no Express você continua usando a raiz '/' para as rotas funcionarem
app.use('/', leiloesRoutes);

// Integração com Sockets e Controller
const leilaoSocket = require('./socket/leilaoSocket');
leilaoSocket(io);

const { setIO } = require('./controllers/leilaoController');
setIO(io);

// Teste de conexão com banco
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Erro ao conectar no banco:', err);
  else console.log('Banco conectado:', res.rows[0].now);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`Serviço de Leilões rodando na porta ${PORT}`);
  await conectarRabbitMQ();

  // Reagendamento de jobs
  const { agendarEncerramento } = require('./jobs/encerrador');
  const leiloes = await pool.query(
    `SELECT * FROM leiloes WHERE status = 'ativo' AND encerra_em > NOW()`
  );
  leiloes.rows.forEach(l => agendarEncerramento(l, io));
  console.log(`${leiloes.rows.length} leilão(ões) reagendado(s)`);

  const { iniciarReconciliador } = require('./jobs/reconciliador');
  iniciarReconciliador(io);
});