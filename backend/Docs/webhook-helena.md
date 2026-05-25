# Configuração de Webhooks da Helena CRM

## Visão Geral

O sistema utiliza **dois webhooks independentes** na Helena: um para produção (servidor em nuvem) e outro opcional para desenvolvimento local (túnel). Eles coexistem sem interferência.

---

## 1. Webhook de Produção

**URL:**
```
https://checkupmais.ippolo.com.br/api/helena/webhook?secret=ws_checkupmais_2026
```

### Eventos recomendados para ativar na Helena:
- [x] Atendimento criado
- [x] Atendimento alterado
- [x] Atendimento concluído
- [ ] Mensagem recebida *(opcional — gera muito volume)*
- [ ] Mensagem enviada *(opcional)*

### Como cadastrar na Helena:
1. Acesse **Configurações → Webhooks → Criar**
2. **Nome:** `Dashboard 360 - Produção`
3. **URL:** cole a URL acima
4. Marque os eventos desejados
5. Clique em **Criar webhook**

---

## 2. Webhook de Desenvolvimento Local (Túnel)

Usado apenas para testar alterações localmente antes de subir para produção.

### Passo 1 — Instalar o Cloudflare Tunnel (uma única vez)
```powershell
winget install Cloudflare.cloudflared
```

### Passo 2 — Subir o backend local
```powershell
cd backend
npm run dev
```

### Passo 3 — Iniciar o túnel (em outro terminal)
```powershell
cloudflared tunnel --url http://localhost:3006
```

O terminal exibirá uma URL pública temporária, exemplo:
```
https://solitary-moon-abc123.trycloudflare.com
```

### Passo 4 — Cadastrar o webhook de desenvolvimento na Helena:
1. Acesse **Configurações → Webhooks → Criar**
2. **Nome:** `Dashboard 360 - Dev Local`
3. **URL:**
```
https://solitary-moon-abc123.trycloudflare.com/api/helena/webhook?secret=ws_ippolo_2026
```
4. Marque os mesmos eventos do webhook de produção
5. Clique em **Criar webhook**

> ⚠️ A URL do túnel muda toda vez que você reinicia o `cloudflared`. Atualize o webhook de dev na Helena sempre que isso acontecer.

> ⚠️ Quando terminar o desenvolvimento, **delete ou desative** o webhook de dev na Helena para não gerar chamadas desnecessárias.

---

## 3. Como funciona internamente

```
Helena CRM
    │
    ├── POST → https://checkupmais.ippolo.com.br/api/helena/webhook  (produção)
    └── POST → https://xxxx.trycloudflare.com/api/helena/webhook (dev local)
              │
              ▼
        Backend Express
        - Valida o ?secret=
        - Invalida cache de KPIs
        - Faz broadcast via SSE (Server-Sent Events)
              │
              ▼
        Frontend React
        - Recebe o evento SSE instantaneamente
        - Chama fetchRealtime() sem aguardar o polling
```

---

## 4. Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `WEBHOOK_SECRET` | Senha incluída na URL do webhook para validar origem |
| `HELENA_CRM_TOKEN` | Token Bearer para chamadas à API da Helena |

O arquivo `backend/.env.example` contém o template com todas as variáveis necessárias para o servidor em nuvem.

---

## 5. Testando o webhook manualmente

Para verificar se o endpoint está respondendo corretamente:

```powershell
# Produção
Invoke-WebRequest -Uri "https://checkupmais.ippolo.com.br/api/helena/webhook?secret=ws_ippolo_2026" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"event":"session.created","data":{"id":"teste-123"}}'

# Local (com túnel ativo)
Invoke-WebRequest -Uri "https://xxxx.trycloudflare.com/api/helena/webhook?secret=ws_ippolo_2026" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"event":"session.created","data":{"id":"teste-123"}}'
```

Resposta esperada: `{"ok":true,"event":"session.created"}`
