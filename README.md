# Dashboard 360º Omni

Sistema de Dashboard para análise de atendimentos omnicanal com backend Node.js e frontend React + TypeScript.

## Estrutura do Projeto

```
Dashboard_360_Omni/
├── backend/          # API Node.js + Express + MySQL
└── frontend/         # React + Vite + TypeScript + Tailwind
```

## Pré-requisitos
teste
- Node.js 18+
- MySQL 8.0+
- npm ou yarn

## Configuração

### 1. Banco de Dados

A tabela `atendimento_kardex` deve existir no MySQL com a seguinte estrutura:

```sql
CREATE TABLE atendimento_kardex (
  id INT AUTO_INCREMENT PRIMARY KEY,
  criacao DATETIME,
  inicio_sessao DATETIME,
  fim_sessao DATETIME,
  status VARCHAR(50),
  tempo_atendimento TIME,
  tempo_espera TIME,
  equipe VARCHAR(100),
  agente VARCHAR(100),
  canal VARCHAR(50),
  -- ... outras colunas
);
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edite o arquivo .env com suas credenciais MySQL
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Funcionalidades

- **Visão Geral**: KPIs principais (total, concluídos, tempos médios)
- **Equipes**: Performance por equipe com gráficos
- **Agentes**: Ranking de agentes e tempos médios
- **Canais**: Distribuição de atendimentos por canal

## Endpoints da API

- `GET /api/kpis/overview` - KPIs gerais
- `GET /api/kpis/timeline` - Dados para gráfico temporal
- `GET /api/kpis/equipes` - Estatísticas por equipe
- `GET /api/kpis/agentes` - Estatísticas por agente
- `GET /api/kpis/canais` - Estatísticas por canal

## Tecnologias

- **Backend**: Node.js, Express, MySQL2, TypeScript
- **Frontend**: React, Vite, TypeScript, TailwindCSS, Recharts, shadcn/ui
