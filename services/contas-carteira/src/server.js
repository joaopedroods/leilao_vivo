require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const carteiraRoutes = require('./routes/carteiraRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', servico: 'contas-carteira' });
});

app.use('/auth', authRoutes);
app.use('/carteira', carteiraRoutes);
app.use('/usuarios', usuariosRoutes);

app.use((err, req, res, next) => {
  console.error('[erro nao tratado]', err);
  res.status(500).json({ erro: 'erro_interno' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[contas-carteira] rodando em http://localhost:${PORT}`);
});
