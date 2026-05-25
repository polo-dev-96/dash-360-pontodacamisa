# Arquitetura de Consultas e Relatórios - Helena CRM

Este documento descreve como o backend processa e entrega os dados da Helena CRM para o Dashboard, diferenciando a estratégia de Tempo Real da estratégia de Relatórios Históricos.

---

## 1. KPIs em Tempo Real (Real-time)

**Objetivo:** Mostrar instantaneamente o que está acontecendo agora (quem está na fila, quem está sendo atendido).

### Funcionamento:
1.  **Cache Centralizado:** O sistema mantém um cache em memória (`sessoesAtivasCache`) no [helena.service.ts](file:///c%3A/Users/carlo/Documents/Vibe%20Code/Dashboard_360_Omni/backend/src/services/helena.service.ts) contendo apenas as sessões com status `STARTED`, `PENDING` ou `IN_PROGRESS`.
2.  **Sincronização Inicial:** Ao iniciar o servidor ou na primeira requisição, o backend faz uma chamada "snapshot" à API da Helena para popular esse cache com o estado atual.
3.  **Atualização via Webhooks:**
    *   Sempre que um atendimento muda de status na Helena, ela dispara um POST para o nosso `/webhook`.
    *   O backend processa esse evento: adiciona a sessão ao cache (se for nova/ativa) ou remove (se for finalizada).
4.  **Broadcast via SSE (Server-Sent Events):**
    *   O frontend mantém uma conexão aberta com `/api/helena/events`.
    *   Assim que o webhook atualiza o cache, o backend recalcula os KPIs e "empurra" o novo JSON para todos os navegadores conectados instantaneamente.

**Vantagem:** Velocidade extrema e baixa carga na API da Helena (consultamos a API apenas uma vez a cada minuto ou no boot).

---

## 2. Relatórios Históricos (Conversas Finalizadas)

**Objetivo:** Gerar relatórios de produtividade, médias de tempo e volumetria de datas passadas.

### Funcionamento:
1.  **Consultas Diretas à API:** Diferente do tempo real, os relatórios **não usam cache**. Eles consultam a API da Helena CRM v2 no momento da requisição.
2.  **Paginação Automática:** Como a API limita a quantidade de itens por resposta, o backend implementa um loop de paginação em `buscarTodasSessoes` que percorre todas as páginas de dados do período solicitado até obter a lista completa.
3.  **Filtros de Data:** O sistema traduz as datas do dashboard para os parâmetros `EndAt.After` e `EndAt.Before` da API Helena, ajustando também os fusos horários (UTC-4 para Manaus).
4.  **Processamento Local:** Após baixar todas as sessões do período, o backend calcula as médias de tempo de espera e atendimento, agrupa por agente/equipe e retorna o resultado consolidado.

**Vantagem:** Precisão absoluta. Como a API é a "Fonte da Verdade", não há risco de perder dados por instabilidades momentâneas do servidor ou do túnel.

---

## 3. Resumo Comparativo

| Característica | Tempo Real (Dashboard) | Relatórios (Histórico) |
| :--- | :--- | :--- |
| **Fonte Primária** | Webhook + Cache Local | API Helena CRM (v2) |
| **Atualização** | Instantânea (Push/SSE) | Sob demanda (Pull/Fetch) |
| **Confiabilidade** | Alta (Sincronizada a cada 1min) | Total (Dados Oficiais) |
| **Uso de Rede** | Baixíssimo | Moderado (devido à paginação) |
| **Exemplo de Uso** | "Quantos estão na fila agora?" | "Qual a média de espera de ontem?" |

---

## 4. Manutenção e Troubleshooting

*   **Divergência de números:** Se o tempo real parecer "travado", o sistema forçará uma nova sincronização com a API após 60 segundos na próxima atualização.
*   **Webhooks não chegando:** Verifique se o processo `cloudflared` está ativo e se a URL no painel da Helena coincide com a URL gerada pelo túnel.
*   **Relatórios lentos:** Consultas de períodos muito longos (ex: 6 meses) podem demorar alguns segundos devido ao grande volume de páginas que o backend precisa baixar e processar da API.
