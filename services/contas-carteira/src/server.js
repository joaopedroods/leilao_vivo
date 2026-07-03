require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importação das rotas
const authRoutes = require('./routes/authRoutes');
const carteiraRoutes = require('./routes/carteiraRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');

const app = express();

// Configuração do CORS:
// Essencial para o navegador permitir a conversa entre o React (5173) e o Backend (8080/NGINX)
app.use(cors({
  origin: 'http://localhost:5173', // Domínio do seu React
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', servico: 'contas-carteira' });
});

// Rotas da aplicação
app.use('/auth', authRoutes);
app.use('/carteira', carteiraRoutes);
app.use('/usuarios', usuariosRoutes);

// Tratamento de erros globais
app.use((err, req, res, next) => {
  console.error('[erro nao tratado]', err);
  res.status(500).json({ erro: 'erro_interno' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[contas-carteira] rodando em http://localhost:${PORT}`);
});