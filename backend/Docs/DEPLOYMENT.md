# Guia de Implantação (Docker Compose) - Dashboard 360º Omni

Este guia descreve os passos para configurar a aplicação na sua VM utilizando **Docker Compose** e integrando com o Caddy na rede `webstack_web`.

## 1. Preparação na VM

Acesse sua VM via SSH e prepare o diretório:

```bash
# Criar a pasta e clonar o repositório
sudo mkdir -p /opt/apps/dash-360-checkupmais
cd /opt/apps/dash-360-checkupmais
sudo git clone https://github.com/seu-usuario/seu-repositorio.git .

# Ajustar permissões
sudo chown -R $USER:$USER /opt/apps/dash-360-checkupmais
```

## 2. Criação dos Arquivos Docker (Na VM)

Como os arquivos Docker não estão no repositório local, crie-os manualmente na pasta `/opt/apps/dash-360-checkupmais`:

### Criar o Dockerfile
```bash
nano Dockerfile
```
Cole o conteúdo abaixo:
```dockerfile
# Estágio de Build do Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Estágio de Build do Backend
FROM node:20-slim AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Estágio Final
FROM node:20-slim
WORKDIR /app

# Copiar arquivos do Backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/

# Copiar arquivos do Frontend (para o backend servir)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Instalar dependências de produção
WORKDIR /app/backend
RUN npm install --omit=dev

EXPOSE 3006

CMD ["node", "dist/server.js"]
```

### Criar o docker-compose.yml
```bash
nano docker-compose.yml
```
Cole o conteúdo abaixo:
```yaml
services:
  dash-360-checkupmais:
    build: .
    container_name: dash-360-checkupmais
    restart: unless-stopped
    environment:
      - PORT=3006
    ports:
      - "3006:3006"
    networks:
      - webstack_web

networks:
  webstack_web:
    external: true
```

## 3. Configuração de Ambiente

Crie o arquivo `.env` para o backend:
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

## 4. Deploy

```bash
# Construir e subir o container
docker compose up -d --build
```

## 5. Configuração do Caddy (Host)

No seu `Caddyfile` da VM, adicione:

```caddy
checkupmais.ippolo.com.br {
    encode gzip
    reverse_proxy host.docker.internal:3006
}
```

Recarregue o Caddy:
```bash
sudo systemctl reload caddy
```

---

## Alternativa: Deploy com PM2

Se você já utiliza PM2 para gerenciar suas aplicações:

### 1. Build do Projeto

```bash
cd /opt/apps/dash-360-checkupmais

# Build do frontend
cd frontend && npm install && npm run build && cd ..

# Build do backend
cd backend && npm install && npm run build && cd ..
```

### 2. Adicionar ao PM2

```bash
pm2 start backend/dist/server.js --name "dash-360-checkupmais"
```

### 3. Configuração do Caddy (PM2)

```caddy
checkupmais.ippolo.com.br {
    encode gzip
    reverse_proxy localhost:3006
}
```

### Comandos Úteis
- **Status**: `pm2 status`
- **Logs**: `pm2 logs dash-360-checkupmais`
- **Restart**: `pm2 restart dash-360-checkupmais`
- **Atualizar**: `git pull && cd backend && npm run build && pm2 restart dash-360-checkupmais`

---

## Troubleshooting

### Erro SSL/HTTPS

Se encontrar `ERR_SSL_PROTOCOL_ERROR`:

1. **Verificar DNS**:
```bash
# Verificar se o domínio aponta para o servidor
nslookup checkupmais.ippolo.com.br
ping checkupmais.ippolo.com.br
```

**Recarregar Caddy**:
```bash
docker compose up -d --force-recreate --no-deps caddy
```

## Comandos Úteis na VM
- **Logs**: `docker compose logs -f`
- **Status**: `docker compose ps`
- **Atualizar**: `git pull && docker compose up -d --build`
