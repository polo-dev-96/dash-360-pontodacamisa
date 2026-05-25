import { Router, Request, Response } from 'express';
import { helenaService } from '../services/helena.service';
import { FiltroHelena, StatusSessao, SessaoHelena, KPIsTempoReal } from '../types/helena.types';

const router = Router();

// ── SSE: lista de clientes conectados ──
const sseClients = new Set<Response>();

function broadcastSSE(data: object): void {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(message);
  }
}

function getFiltroHelenaFromQuery(req: Request): FiltroHelena {
  const { dataInicio, dataFim, status } = req.query;
  return {
    ...(dataInicio && { dataInicio: dataInicio as string }),
    ...(dataFim && { dataFim: dataFim as string }),
    ...(status && { status: status as StatusSessao }),
  };
}

// ── GET /events — Server-Sent Events (frontend se conecta aqui) ──
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  sseClients.add(res);
  console.log(`[Helena SSE] Cliente conectado. Total: ${sseClients.size}`);

  const heartbeat = setInterval(() => {
    res.write(':ping\n\n');
  }, 30_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    console.log(`[Helena SSE] Cliente desconectado. Total: ${sseClients.size}`);
  });
});

// ── POST /webhook — recebe eventos da Helena CRM ──
router.post('/webhook', async (req: Request, res: Response) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.query.secret !== secret) {
    console.warn('[Helena Webhook] Tentativa com secret inválido');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const resultado = await helenaService.processarWebhook(req.body);
    
    // Transmitir via SSE se houver dados úteis
    if (resultado.type === 'realtime') {
      broadcastSSE({ 
        type: 'realtime', 
        source: 'webhook', 
        event: resultado.event, 
        data: resultado.data, 
        ts: Date.now() 
      });
    } else {
      broadcastSSE({ 
        type: 'webhook', 
        event: resultado.event, 
        ts: Date.now() 
      });
    }

    res.status(200).json({ ok: true, event: resultado.event });
  } catch (error) {
    console.error('[Helena Webhook] Erro ao processar:', error);
    res.status(200).json({ ok: true, error: 'Internal processing error' });
  }
});

router.get('/realtime', async (_req: Request, res: Response) => {
  console.log('[Helena API] GET /realtime chamado às', new Date().toLocaleTimeString('pt-BR'));
  try {
    const data = await helenaService.getKPIsTempoReal();
    res.json(data);
  } catch (error) {
    console.warn('[HelenaRoutes] Erro ao buscar KPIs em tempo real (token offline?):', error);
    res.json({
      emEspera: 0,
      emAtendimento: 0,
      total: 0,
      porEquipe: [],
      atualizadoEm: new Date().toISOString(),
    });
  }
});

router.get('/finalizados', async (req: Request, res: Response) => {
  try {
    const filtro = getFiltroHelenaFromQuery(req);
    const data = await helenaService.getKPIsFinalizados(filtro);
    res.json(data);
  } catch (error) {
    console.warn('[HelenaRoutes] Erro ao buscar atendimentos finalizados:', error);
    res.json({
      total: 0,
      sessoesFinalizadas: [],
      tempoEsperaMedioSegundos: 0,
      tempoAtendimentoMedioSegundos: 0,
      tempoEsperaFormatado: '0s',
      tempoAtendimentoFormatado: '0s',
      porCanal: [],
      porAgente: [],
      porEquipe: [],
    });
  }
});

router.get('/sessoes', async (req: Request, res: Response) => {
  try {
    const filtro = getFiltroHelenaFromQuery(req);
    const data = await helenaService.getSessoes(filtro);
    res.json(data);
  } catch (error) {
    console.warn('[HelenaRoutes] Erro ao buscar sessões:', error);
    res.json([]);
  }
});

router.get('/agentes', async (req: Request, res: Response) => {
  try {
    const filtro = getFiltroHelenaFromQuery(req);
    const data = await helenaService.getAgentesPerformance(filtro);
    res.json(data);
  } catch (error) {
    console.warn('[HelenaRoutes] Erro ao buscar desempenho por agente:', error);
    res.json([]);
  }
});

router.get('/equipes', async (req: Request, res: Response) => {
  try {
    const filtro = getFiltroHelenaFromQuery(req);
    const data = await helenaService.getEquipesPerformance(filtro);
    res.json(data);
  } catch (error) {
    console.warn('[HelenaRoutes] Erro ao buscar desempenho por equipe:', error);
    res.json([]);
  }
});

router.get('/classificacoes', async (req: Request, res: Response) => {
  try {
    const filtro = getFiltroHelenaFromQuery(req);
    const data = await helenaService.getClassificacoes(filtro);
    res.json(data);
  } catch (error) {
    console.warn('[HelenaRoutes] Erro ao buscar classificações:', error);
    res.json({
      total: 0,
      totalFinalizados: 0,
      classificacoes: [],
      porAgente: [],
    });
  }
});

router.get('/departamentos', async (_req: Request, res: Response) => {
  try {
    const mapa = await helenaService.getDepartamentos();
    // Converter Map para array de objetos
    const lista = Array.from(mapa.entries()).map(([id, name]) => ({ id, name }));
    res.json(lista);
  } catch (error) {
    console.warn('[HelenaRoutes] Erro ao buscar departamentos:', error);
    res.json([]);
  }
});

export default router;
