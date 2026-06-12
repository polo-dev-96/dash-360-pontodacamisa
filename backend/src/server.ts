import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helenaRoutes from './routes/helena.routes';
import crmRoutes from './routes/crm.routes';
import path from 'path';
import fs from 'fs';

const envPath = path.join(__dirname, '../.env');
console.log('[Server] Tentando carregar .env de:', envPath);
console.log('[Server] Arquivo .env existe?', fs.existsSync(envPath));

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('[Server] Erro ao carregar .env:', result.error);
} else {
  console.log('[Server] .env carregado com sucesso!');
}

console.log('[Server] HELENA_CRM_TOKEN está definida?', !!process.env.HELENA_CRM_TOKEN);
if (!process.env.HELENA_CRM_TOKEN) {
  console.log('[Server] Conteúdo do diretório acima do __dirname:', fs.readdirSync(path.join(__dirname, '..')));
}

const app = express();
const PORT = parseInt(process.env.PORT || '3006', 10);

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/helena', helenaRoutes);
app.use('/api/crm', crmRoutes);

// Servir arquivos estáticos do Frontend em produção
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Rota para o Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Qualquer outra rota redireciona para o index.html do Frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API Helena disponível em:`);
  console.log(`   Local:   http://localhost:${PORT}/api/helena`);
  console.log(`   Rede:    http://192.168.0.96:${PORT}/api/helena`);
});
