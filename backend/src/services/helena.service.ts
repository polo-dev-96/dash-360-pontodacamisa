import {
  SessaoHelena,
  RespostaHelenaSession,
  KPIsTempoReal,
  KPIsFinalizados,
  FiltroHelena,
  StatusSessao,
  DepartamentoHelena,
  AgenteHelena,
  ClassificacoesHelenaResponse,
  ClassificacaoHelena,
  ClassificacaoHelenaPorAgente,
  AgentePerformanceHelena,
  EquipePerformanceHelena,
} from '../types/helena.types';

const BASE_URL = 'https://api.wts.chat/chat/v2';
const CORE_URL = 'https://api.wts.chat/core/v2';
const CORE_V1_URL = 'https://api.wts.chat/core/v1';

function getToken(): string {
  const token = process.env.HELENA_CRM_TOKEN;
  if (!token) {
    throw new Error('HELENA_CRM_TOKEN não configurado no .env');
  }
  return token;
}

function formatarTempo(segundos: number): string {
  if (segundos <= 0) return '0s';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Cache de departamentos ──
let cacheDepartamentos: Map<string, string> | null = null;
let cacheDepartamentosAt: number = 0;
const TTL_DEPARTAMENTOS_MS = 5 * 60_000; // 5 minutos

async function getDepartamentos(): Promise<Map<string, string>> {
  const agora = Date.now();
  if (cacheDepartamentos && agora - cacheDepartamentosAt < TTL_DEPARTAMENTOS_MS) {
    return cacheDepartamentos;
  }

  const token = getToken();
  const url = `${CORE_URL}/department`;
  console.log(`[Helena CRM] GET departamentos ${url}`);

  const resposta = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error(`[Helena CRM] Erro ao buscar departamentos [${resposta.status}]: ${corpo}`);
    // retorna cache antigo se existir, senão mapa vazio
    return cacheDepartamentos ?? new Map();
  }

  const json: any = await resposta.json();
  const dados: DepartamentoHelena[] = Array.isArray(json)
    ? json
    : (json?.items ?? json?.data ?? []);

  const mapa = new Map<string, string>();
  for (const dep of dados) {
    if (dep.id && dep.name) {
      mapa.set(dep.id, dep.name);
    }
  }

  cacheDepartamentos = mapa;
  cacheDepartamentosAt = agora;
  console.log(`[Helena CRM] ${dados.length} departamentos carregados`);
  return mapa;
}

function resolverNomeEquipe(departamentos: Map<string, string>, id?: string): string {
  if (!id) return 'Sem equipe';
  return departamentos.get(id) ?? id;
}

// ── Cache de agentes ──
let cacheAgentes: Map<string, string> | null = null;
let cacheAgentesAt: number = 0;
const TTL_AGENTES_MS = 5 * 60_000; // 5 minutos

async function getAgentes(): Promise<Map<string, string>> {
  const agora = Date.now();
  if (cacheAgentes && agora - cacheAgentesAt < TTL_AGENTES_MS) {
    return cacheAgentes;
  }

  const token = getToken();
  const url = `${CORE_V1_URL}/agent`;
  console.log(`[Helena CRM] GET agentes ${url}`);

  const resposta = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error(`[Helena CRM] Erro ao buscar agentes [${resposta.status}]: ${corpo}`);
    return cacheAgentes ?? new Map();
  }

  const json: any = await resposta.json();
  const dados: AgenteHelena[] = Array.isArray(json)
    ? json
    : (json?.items ?? json?.data ?? []);

  const mapa = new Map<string, string>();
  for (const agente of dados) {
    // O campo userId do agente bate com o userId da sessão
    const key = (agente as any).userId ?? agente.id;
    const nome = agente.name || (agente as any).shortName || 'Sem nome';
    if (key && nome) {
      mapa.set(key, nome);
    }
  }

  cacheAgentes = mapa;
  cacheAgentesAt = agora;
  console.log(`[Helena CRM] ${dados.length} agentes carregados`);
  return mapa;
}

function resolverNomeAgente(agentes: Map<string, string>, id?: string): string {
  if (!id) return 'Sem agente';
  return agentes.get(id) ?? id;
}

let cacheCanais: Map<string, { name: string; number: string | null }> | null = null;
let cacheCanaisAt: number = 0;
const TTL_CANAIS_MS = 5 * 60_000;

async function getCanais(): Promise<Map<string, { name: string; number: string | null }>> {
  const agora = Date.now();
  if (cacheCanais && agora - cacheCanaisAt < TTL_CANAIS_MS) return cacheCanais;
  const token = getToken();
  const url = `${CORE_URL}/department`;
  console.log(`[Helena CRM] GET canais (via departamentos) ${url}`);
  const resposta = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error(`[Helena CRM] Erro ao buscar canais [${resposta.status}]: ${corpo}`);
    return cacheCanais ?? new Map();
  }
  const json: any = await resposta.json();
  const dados: any[] = Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);
  const mapa = new Map<string, { name: string; number: string | null }>();
  for (const dep of dados) {
    if (dep.channels && Array.isArray(dep.channels)) {
      for (const ch of dep.channels) {
        if (ch.id) {
          mapa.set(ch.id, { name: ch.name || 'Canal sem nome', number: ch.number || null });
        }
      }
    }
  }
  cacheCanais = mapa;
  cacheCanaisAt = agora;
  console.log(`[Helena CRM] ${mapa.size} canais carregados`);
  return mapa;
}

function resolverNomeCanal(canais: Map<string, { name: string; number: string | null }>, sessao: SessaoHelena): string {
  const s = sessao as any;
  // Se tivermos os detalhes do canal diretamente na sessão (via includeDetails)
  if (s.channelDetails) {
    const platform = s.channelDetails.platform || '';
    const humanId = s.channelDetails.humanId || '';
    if (platform && humanId) return `${platform} · ${humanId}`;
    if (humanId) return humanId;
  }

  // Fallback para o cache de canais
  const id = sessao.channelId;
  if (!id) return 'Canal desconhecido';
  const c = canais.get(id);
  if (!c) return id;
  if (c.number) return `${c.name} · ${c.number}`;
  return c.name;
}

// ── Cache de KPIs Tempo Real ──
let cacheRealtime: { data: KPIsTempoReal; at: number } | null = null;
const TTL_REALTIME_MS = 2_000; // 2 segundos (apenas para evitar requisições duplicadas do mesmo tick)

// ── Cache de Sessões Ativas (Alimentado por API e Webhooks) ──
const sessoesAtivasCache = new Map<string, SessaoHelena>();
let cacheSessoesAtivasIniciado = false;
let lastApiSyncAt = 0;
const SYNC_INTERVAL_MS = 60_000; // Sincronizar com API a cada 1 minuto

const STATUS_EM_ESPERA: StatusSessao[] = ['UNDEFINED', 'STARTED', 'PENDING'];
const STATUS_EM_ATENDIMENTO: StatusSessao[] = ['IN_PROGRESS'];
const STATUS_ATIVOS: StatusSessao[] = [...STATUS_EM_ESPERA, ...STATUS_EM_ATENDIMENTO];
const STATUS_FINALIZADOS: StatusSessao[] = ['COMPLETED', 'HIDDEN'];

function isSessaoAtiva(s: SessaoHelena): boolean {
  return STATUS_ATIVOS.includes(s.status);
}

function isEmEspera(s: SessaoHelena): boolean {
  return STATUS_EM_ESPERA.includes(s.status);
}

function isEmAtendimento(s: SessaoHelena): boolean {
  return STATUS_EM_ATENDIMENTO.includes(s.status);
}

async function computarKPIsFromCache(filtro: FiltroHelena = {}): Promise<KPIsTempoReal> {
  const todasSessoesOriginais = Array.from(sessoesAtivasCache.values());
  let todasSessoes = todasSessoesOriginais;

  const [departamentos, canais] = await Promise.all([getDepartamentos(), getCanais()]);

  // Lista completa de equipes e canais (para popular os selects sempre)
  const todasEquipesSet = new Set<string>();
  const todosCanaisSet = new Set<string>();
  for (const s of todasSessoesOriginais) {
    todasEquipesSet.add(resolverNomeEquipe(departamentos, s.departmentId));
    todosCanaisSet.add(resolverNomeCanal(canais, s));
  }

  // Aplicar filtro por data de criação (createdAt) se informado
  if (filtro.dataInicio || filtro.dataFim) {
    const inicio = filtro.dataInicio ? new Date(filtro.dataInicio + 'T00:00:00.000Z').getTime() : null;
    const fim = filtro.dataFim ? new Date(filtro.dataFim + 'T23:59:59.999Z').getTime() : null;
    todasSessoes = todasSessoes.filter(s => {
      if (!s.createdAt) return false;
      const ts = new Date(s.createdAt).getTime();
      if (inicio && ts < inicio) return false;
      if (fim && ts > fim) return false;
      return true;
    });
  }

  // Aplicar filtro por data de início do atendimento (startAt) se informado
  if (filtro.startAtInicio || filtro.startAtFim) {
    const inicio = filtro.startAtInicio ? new Date(filtro.startAtInicio + 'T00:00:00.000Z').getTime() : null;
    const fim = filtro.startAtFim ? new Date(filtro.startAtFim + 'T23:59:59.999Z').getTime() : null;
    todasSessoes = todasSessoes.filter(s => {
      if (!s.startAt) return false;
      const ts = new Date(s.startAt).getTime();
      if (inicio && ts < inicio) return false;
      if (fim && ts > fim) return false;
      return true;
    });
  }

  // Aplicar filtros de equipe e canal se informados
  if (filtro.equipe) {
    todasSessoes = todasSessoes.filter(s => resolverNomeEquipe(departamentos, s.departmentId) === filtro.equipe);
  }
  if (filtro.canal) {
    todasSessoes = todasSessoes.filter(s => resolverNomeCanal(canais, s) === filtro.canal);
  }

  const emEspera = todasSessoes.filter(isEmEspera).length;
  const emAtendimento = todasSessoes.filter(isEmAtendimento).length;

  const porEquipeMap = new Map<string, number>();
  const porCanalMap = new Map<string, number>();

  for (const s of todasSessoes) {
    const equipe = resolverNomeEquipe(departamentos, s.departmentId);
    porEquipeMap.set(equipe, (porEquipeMap.get(equipe) ?? 0) + 1);

    const canal = resolverNomeCanal(canais, s);
    porCanalMap.set(canal, (porCanalMap.get(canal) ?? 0) + 1);
  }

  return {
    emEspera,
    emAtendimento,
    total: emEspera + emAtendimento,
    porEquipe: Array.from(porEquipeMap.entries())
      .map(([equipe, total]) => ({ equipe, total }))
      .sort((a, b) => b.total - a.total),
    porCanal: Array.from(porCanalMap.entries())
      .map(([canal, total]) => ({ canal, total }))
      .sort((a, b) => b.total - a.total),
    todasEquipes: Array.from(todasEquipesSet).sort(),
    todosCanais: Array.from(todosCanaisSet).sort(),
    atualizadoEm: new Date().toISOString(),
  };
}

// ── Extrair sessão do payload do webhook ──
function extrairSessaoDoWebhook(body: any): SessaoHelena | null {
  if (!body || typeof body !== 'object') return null;

  const candidatos = [
    body.content,
    body.data,
    body.session,
    body.payload,
    body.sessao,
    body.item,
    body.id && body.status ? body : null,
  ];

  for (const c of candidatos) {
    if (c && typeof c === 'object' && c.id && c.status) {
      const statusConhecidos: StatusSessao[] = [...STATUS_ATIVOS, ...STATUS_FINALIZADOS];
      if (statusConhecidos.includes(c.status)) {
        return c as SessaoHelena;
      }
    }
  }

  return null;
}

async function processarWebhook(body: any): Promise<{ type: string; data?: KPIsTempoReal; event: string }> {
  const evento = body;
  const tipoEvento = evento?.eventType ?? evento?.event ?? evento?.type ?? 'desconhecido';
  console.log(`[Helena Service] Processando webhook: ${tipoEvento}`);

  // Se o cache não estiver iniciado, vamos iniciar antes de processar
  if (!cacheSessoesAtivasIniciado) {
    console.log('[Helena Service] Cache não iniciado. Carregando dados iniciais antes de processar webhook...');
    await getKPIsTempoReal();
  }

  const sessao = extrairSessaoDoWebhook(evento);
  if (sessao) {
    console.log(`[Helena Service] Sessão webhook: id=${sessao.id} status=${sessao.status}`);

    if (isSessaoAtiva(sessao)) {
      sessoesAtivasCache.set(sessao.id, sessao);
      console.log(`[Helena Service] Cache atualizado: +${sessao.id} | total=${sessoesAtivasCache.size}`);
    } else if (STATUS_FINALIZADOS.includes(sessao.status)) {
      const removido = sessoesAtivasCache.delete(sessao.id);
      console.log(`[Helena Service] Cache atualizado: -${sessao.id} | removido=${removido} | total=${sessoesAtivasCache.size}`);
    }

    const kpis = await computarKPIsFromCache({});
    invalidateRealtimeCache();
    return { type: 'realtime', data: kpis, event: tipoEvento };
  }

  return { type: 'webhook', event: tipoEvento };
}

const TAMANHO_PAGINA = 100;

async function buscarPagina(
  filtro: FiltroHelena,
  pageNumber: number,
  pageSize: number
): Promise<RespostaHelenaSession> {
  try {
    const token = getToken();

    const params = new URLSearchParams();
    if (filtro.status) params.append('status', filtro.status);
    // API Helena v2 usa EndAt.After/Before para filtrar período de finalização
    // Ajuste para UTC-04 (Manaus): adicionar 4h no início e usar até 03:59:59 do dia seguinte no fim
    if (filtro.dataInicio) params.append('EndAt.After', `${filtro.dataInicio}T04:00:00.000Z`);
    if (filtro.dataFim) {
      const diaSeguinte = new Date(`${filtro.dataFim}T00:00:00`);
      diaSeguinte.setDate(diaSeguinte.getDate() + 1);
      const diaSeguinteStr = diaSeguinte.toISOString().split('T')[0];
      params.append('EndAt.Before', `${diaSeguinteStr}T03:59:59.999Z`);
    }
    params.append('pageNumber', String(pageNumber));
    params.append('pageSize', String(pageSize));

    // Incluir detalhes conforme visto na integração n8n para trazer as classificações
    const details = [
      'AgentDetails',
      'DepartmentsDetails',
      'ContactDetails',
      'ChannelTypeDetails',
      'ClassificationDetails',
      'ChannelDetails'
    ];
    details.forEach(d => params.append('includeDetails', d));

    const url = `${BASE_URL}/session?${params.toString()}`;
    console.log(`[Helena CRM] GET ${url}`);
    console.log(`[Helena CRM] DEBUG params: status=${filtro.status}, EndAt.After=${filtro.dataInicio}, EndAt.Before=${filtro.dataFim}`);

    const startTime = performance.now();
    const resposta = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resposta.ok) {
      const corpo = await resposta.text();
      throw new Error(`Erro ao consultar Helena CRM [${resposta.status}]: ${corpo}`);
    }

    const elapsedMs = performance.now() - startTime;

    const json = await resposta.json();
    if (Array.isArray(json)) {
      console.log(`[Helena CRM] ${elapsedMs.toFixed(0)}ms | resposta array, itens=${json.length}`);
      return { items: json, totalItems: json.length, totalPages: 1, hasMorePages: false };
    }
    const r = json as RespostaHelenaSession;
    console.log(`[Helena CRM] ${elapsedMs.toFixed(0)}ms | totalItems=${r.totalItems} totalPages=${r.totalPages} hasMorePages=${r.hasMorePages} itens=${r.items?.length}`);
    return r;
  } catch (err: any) {
    console.error(`[Helena CRM] Erro em buscarPagina: ${err?.message ?? err}`);
    throw err;
  }
}

async function buscarTodasSessoes(filtro: FiltroHelena = {}): Promise<SessaoHelena[]> {
  const todasSessoes: SessaoHelena[] = [];
  let pagina = 1;

  while (true) {
    const resp = await buscarPagina(filtro, pagina, TAMANHO_PAGINA);
    const itens = resp.items ?? [];
    todasSessoes.push(...itens);

    console.log(
      `[Helena CRM] Página ${pagina}/${resp.totalPages ?? '?'} — itens=${itens.length} — acumulado=${todasSessoes.length}/${resp.totalItems ?? '?'}`
    );

    if (!resp.hasMorePages) break;
    pagina++;
  }

  return todasSessoes;
}

const MAX_PAGE_SIZE = 100;

async function buscarSessoesComLimite(
  filtro: FiltroHelena,
  maxItens: number = 500
): Promise<SessaoHelena[]> {
  const todas: SessaoHelena[] = [];
  let pagina = 1;

  while (todas.length < maxItens) {
    const resp = await buscarPagina(filtro, pagina, MAX_PAGE_SIZE);
    const itens = resp.items ?? [];
    todas.push(...itens);
    if (!resp.hasMorePages || itens.length === 0) break;
    pagina++;
  }

  return todas;
}

async function getKPIsTempoReal(filtro: FiltroHelena = {}): Promise<KPIsTempoReal> {
  const agora = Date.now();

  // Se há filtro, computa diretamente do cache sem usar o cache global
  const temFiltro = !!(filtro.equipe || filtro.canal);
  if (temFiltro) {
    if (cacheSessoesAtivasIniciado) {
      return computarKPIsFromCache(filtro);
    }
    return {
      emEspera: 0,
      emAtendimento: 0,
      total: 0,
      porEquipe: [],
      porCanal: [],
      todasEquipes: [],
      todosCanais: [],
      atualizadoEm: new Date().toISOString(),
    };
  }

  // Se o cache já foi iniciado e o TTL de realtime não expirou, retorna cache rápido
  if (cacheRealtime && agora - cacheRealtime.at < TTL_REALTIME_MS) {
    return cacheRealtime.data;
  }

  // Se o cache já foi iniciado e ainda não deu tempo de sincronizar com a API novamente,
  // apenas computa a partir do que temos no cache (que foi atualizado pelos webhooks)
  if (cacheSessoesAtivasIniciado && agora - lastApiSyncAt < SYNC_INTERVAL_MS) {
    const resultado = await computarKPIsFromCache();
    cacheRealtime = { data: resultado, at: agora };
    return resultado;
  }

  try {
    console.log('[Helena Service] Sincronizando sessões ativas com a API...');
    const todasSessoes: SessaoHelena[] = [];
    let pagina = 1;

    // Log para contar status
    const contadorStatus = new Map<string, number>();

    // Buscar TODAS as sessões (sem limite)
    while (true) {
      const resp = await buscarPagina({}, pagina, TAMANHO_PAGINA);
      const itens = resp.items ?? [];

      // Contar status de TODOS os itens
      for (const s of itens) {
        const status = s.status || 'DESCONHECIDO';
        contadorStatus.set(status, (contadorStatus.get(status) || 0) + 1);
      }

      // Filtrar apenas as sessões ATIVAS
      const itensAtivos = itens.filter(isSessaoAtiva);
      todasSessoes.push(...itensAtivos);

      console.log(
        `[Helena CRM] realtime página ${pagina}: recebidos=${itens.length} ativos=${itensAtivos.length} acumulado=${todasSessoes.length}`
      );

      if (!resp.hasMorePages || itens.length === 0) break;
      pagina++;
    }

    // Log detalhado dos status
    console.log('[Helena Service] 📊 Status encontrados na API:');
    for (const [status, qtd] of contadorStatus.entries()) {
      console.log(`  - ${status}: ${qtd}`);
    }
    console.log(`[Helena Service] Status considerados ATIVOS: ${STATUS_ATIVOS.join(', ')}`);

    // Sincronizar com o cache de sessões ativas
    sessoesAtivasCache.clear();
    for (const s of todasSessoes) {
      sessoesAtivasCache.set(s.id, s);
    }
    cacheSessoesAtivasIniciado = true;
    lastApiSyncAt = agora;
    console.log(`[Helena Service] Cache de sessões ativas sincronizado: ${sessoesAtivasCache.size} itens`);

    const resultado = await computarKPIsFromCache();
    cacheRealtime = { data: resultado, at: agora };
    return resultado;
  } catch (err: any) {
    console.error('[Helena CRM] Erro em getKPIsTempoReal:', err?.message ?? err);
    if (cacheSessoesAtivasIniciado) {
      return computarKPIsFromCache();
    }
    return {
      emEspera: 0,
      emAtendimento: 0,
      total: 0,
      porEquipe: [],
      porCanal: [],
      todasEquipes: [],
      todosCanais: [],
      atualizadoEm: new Date().toISOString(),
    };
  }
}

function parseTimeWait(timeWait: string | undefined): number {
  if (!timeWait || timeWait === 'null') return 0;
  const parts = timeWait.split(':');
  if (parts.length !== 3) return 0;
  const [hours, minutes, seconds] = parts.map(Number);
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function calcWaitSeconds(s: SessaoHelena): number {
  // Usar timeWait da API Helena quando disponível (formato HH:MM:SS)
  if (s.timeWait) {
    return parseTimeWait(s.timeWait);
  }
  // Fallback: calcular pelo intervalo entre createdAt e startAt
  if (!s.startAt || !s.createdAt) return 0;
  return Math.max(0, (new Date(s.startAt).getTime() - new Date(s.createdAt).getTime()) / 1000);
}

function calcServiceSeconds(s: SessaoHelena): number {
  // Usar timeService da API Helena quando disponível (formato HH:MM:SS)
  if (s.timeService) {
    return parseTimeWait(s.timeService);
  }
  // Fallback: calcular pelo intervalo entre startAt e endAt
  if (!s.endAt || !s.startAt) return 0;
  return Math.max(0, (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / 1000);
}

async function getKPIsFinalizados(filtro: FiltroHelena = {}): Promise<KPIsFinalizados> {
  console.log(`[Helena CRM] getKPIsFinalizados chamado para o período ${filtro.dataInicio} até ${filtro.dataFim}`);
  
  const [sessoesCompleted, sessoesHidden] = await Promise.all([
    buscarTodasSessoes({ ...filtro, status: 'COMPLETED' }),
    buscarTodasSessoes({ ...filtro, status: 'HIDDEN' })
  ]);

  let sessoes = [...sessoesCompleted, ...sessoesHidden];
  console.log(`[Helena CRM] Total sessões finalizadas (COMPLETED=${sessoesCompleted.length}, HIDDEN=${sessoesHidden.length}): ${sessoes.length}`);

  const [departamentos, agentes, canais] = await Promise.all([getDepartamentos(), getAgentes(), getCanais()]);

  // Aplicar filtros de equipe e canal se informados
  if (filtro.equipe) {
    sessoes = sessoes.filter(s => resolverNomeEquipe(departamentos, s.departmentId) === filtro.equipe);
    console.log(`[Helena CRM] Filtro equipe='${filtro.equipe}': ${sessoes.length} sessões`);
  }
  if (filtro.canal) {
    sessoes = sessoes.filter(s => resolverNomeCanal(canais, s) === filtro.canal);
    console.log(`[Helena CRM] Filtro canal='${filtro.canal}': ${sessoes.length} sessões`);
  }

  // DEBUG: verificar campos timeWait/timeService
  const comTimeWait = sessoes.filter(s => s.timeWait).length;
  const comTimeService = sessoes.filter(s => s.timeService).length;
  console.log(`[Helena CRM] DEBUG: ${comTimeWait} sessões com timeWait, ${comTimeService} com timeService`);

  // DEBUG: verificar tempos extremos
  const temposAtendimento = sessoes
    .map(s => calcServiceSeconds(s))
    .filter(t => t > 0)
    .sort((a, b) => a - b);
  const maxTempo = temposAtendimento.length > 0 ? temposAtendimento[temposAtendimento.length - 1] : 0;
  const minTempo = temposAtendimento.length > 0 ? temposAtendimento[0] : 0;
  console.log(`[Helena CRM] DEBUG tempos atendimento: total=${temposAtendimento.length}, min=${Math.round(minTempo)}s, max=${Math.round(maxTempo)}s`);

  // Remover outliers: limitar a 8 horas (28800s) para média
  const MAX_TEMPO_ATENDIMENTO_S = 8 * 3600; // 8 horas
  const MAX_TEMPO_ESPERA_S = 2 * 3600; // 2 horas

  const temposAtendimentoValidos = temposAtendimento.filter(t => t <= MAX_TEMPO_ATENDIMENTO_S);
  const temposEsperaValidos = sessoes
    .map(s => calcWaitSeconds(s))
    .filter(t => t > 0 && t <= MAX_TEMPO_ESPERA_S);

  const tempoEsperaMedioSegundos =
    temposEsperaValidos.length > 0
      ? temposEsperaValidos.reduce((a, b) => a + b, 0) / temposEsperaValidos.length
      : 0;

  const tempoAtendimentoMedioSegundos =
    temposAtendimentoValidos.length > 0
      ? temposAtendimentoValidos.reduce((a, b) => a + b, 0) / temposAtendimentoValidos.length
      : 0;

  const porCanalMap = new Map<string, number>();
  const porAgenteMap = new Map<string, number>();
  const porEquipeMap = new Map<string, number>();

  for (const sessao of sessoes) {
    const canal = resolverNomeCanal(canais, sessao);
    porCanalMap.set(canal, (porCanalMap.get(canal) ?? 0) + 1);

    const agente = resolverNomeAgente(agentes, sessao.userId);
    porAgenteMap.set(agente, (porAgenteMap.get(agente) ?? 0) + 1);

    const equipe = resolverNomeEquipe(departamentos, sessao.departmentId);
    porEquipeMap.set(equipe, (porEquipeMap.get(equipe) ?? 0) + 1);
  }

  return {
    total: sessoes.length,
    sessoesFinalizadas: sessoes,
    tempoEsperaMedioSegundos: Math.round(tempoEsperaMedioSegundos),
    tempoAtendimentoMedioSegundos: Math.round(tempoAtendimentoMedioSegundos),
    tempoEsperaFormatado: formatarTempo(Math.round(tempoEsperaMedioSegundos)),
    tempoAtendimentoFormatado: formatarTempo(Math.round(tempoAtendimentoMedioSegundos)),
    porCanal: Array.from(porCanalMap.entries()).map(([canal, total]) => ({ canal, total })),
    porAgente: Array.from(porAgenteMap.entries())
      .map(([agente, total]) => ({ agente, total }))
      .sort((a, b) => b.total - a.total),
    porEquipe: Array.from(porEquipeMap.entries())
      .map(([equipe, total]) => ({ equipe, total }))
      .sort((a, b) => b.total - a.total),
  };
}

async function getAgentesPerformance(filtro: FiltroHelena = {}): Promise<AgentePerformanceHelena[]> {
  console.log(`[Helena CRM] getAgentesPerformance iniciado. Filtro:`, JSON.stringify(filtro));

  const [sessoesCompleted, sessoesHidden] = await Promise.all([
    buscarTodasSessoes({ ...filtro, status: 'COMPLETED' }),
    buscarTodasSessoes({ ...filtro, status: 'HIDDEN' })
  ]);

  const sessoes = [...sessoesCompleted, ...sessoesHidden];
  console.log(`[Helena CRM] getAgentesPerformance: ${sessoes.length} sessões finalizadas`);

  const MAX_TEMPO_ATENDIMENTO_S = 8 * 3600;
  const MAX_TEMPO_ESPERA_S = 2 * 3600;

  const agentes = await getAgentes();
  const departamentos = await getDepartamentos();

  const statsMap = new Map<string, {
    total: number;
    temposEspera: number[];
    temposAtendimento: number[];
    temposPrimeiraResposta: number[];
  }>();

  for (const sessao of sessoes) {
    const nomeAgente = resolverNomeAgente(agentes, sessao.userId);

    if (!statsMap.has(nomeAgente)) {
      statsMap.set(nomeAgente, { total: 0, temposEspera: [], temposAtendimento: [], temposPrimeiraResposta: [] });
    }

    const stats = statsMap.get(nomeAgente)!;
    stats.total += 1;

    const tempoEspera = calcWaitSeconds(sessao);
    if (tempoEspera > 0 && tempoEspera <= MAX_TEMPO_ESPERA_S) {
      stats.temposEspera.push(tempoEspera);
    }

    const tempoAtendimento = calcServiceSeconds(sessao);
    if (tempoAtendimento > 0 && tempoAtendimento <= MAX_TEMPO_ATENDIMENTO_S) {
      stats.temposAtendimento.push(tempoAtendimento);
    }

    // Tempo até primeira resposta do agente: startAt - createdAt
    if (sessao.createdAt && sessao.startAt) {
      const primeiraResposta = Math.max(0, (new Date(sessao.startAt).getTime() - new Date(sessao.createdAt).getTime()) / 1000);
      if (primeiraResposta > 0 && primeiraResposta <= MAX_TEMPO_ESPERA_S) {
        stats.temposPrimeiraResposta.push(primeiraResposta);
      }
    }
  }

  const resultado: AgentePerformanceHelena[] = [];
  for (const [agente, stats] of statsMap.entries()) {
    const tempoEsperaMedio = stats.temposEspera.length > 0
      ? Math.round(stats.temposEspera.reduce((a, b) => a + b, 0) / stats.temposEspera.length)
      : 0;

    const tempoAtendimentoMedio = stats.temposAtendimento.length > 0
      ? Math.round(stats.temposAtendimento.reduce((a, b) => a + b, 0) / stats.temposAtendimento.length)
      : 0;

    const tempoPrimeiraRespostaMedio = stats.temposPrimeiraResposta.length > 0
      ? Math.round(stats.temposPrimeiraResposta.reduce((a, b) => a + b, 0) / stats.temposPrimeiraResposta.length)
      : 0;

    resultado.push({
      agente,
      total: stats.total,
      tempoEsperaMedioSegundos: tempoEsperaMedio,
      tempoEsperaMedioFormatado: formatarTempo(tempoEsperaMedio),
      tempoAtendimentoMedioSegundos: tempoAtendimentoMedio,
      tempoAtendimentoMedioFormatado: formatarTempo(tempoAtendimentoMedio),
      tempoPrimeiraRespostaMedioSegundos: tempoPrimeiraRespostaMedio,
      tempoPrimeiraRespostaMedioFormatado: formatarTempo(tempoPrimeiraRespostaMedio),
    });
  }

  return resultado.sort((a, b) => b.total - a.total);
}

function resolverNomeEquipeFromSessao(sessao: SessaoHelena, departamentos: Map<string, string>): string {
  const s = sessao as any;
  if (s.departmentDetails && typeof s.departmentDetails.name === 'string' && s.departmentDetails.name.trim()) {
    return s.departmentDetails.name.trim();
  }
  return resolverNomeEquipe(departamentos, sessao.departmentId);
}

async function getEquipesPerformance(filtro: FiltroHelena = {}): Promise<EquipePerformanceHelena[]> {
  console.log(`[Helena CRM] getEquipesPerformance iniciado. Filtro:`, JSON.stringify(filtro));

  const [sessoesCompleted, sessoesHidden] = await Promise.all([
    buscarTodasSessoes({ ...filtro, status: 'COMPLETED' }),
    buscarTodasSessoes({ ...filtro, status: 'HIDDEN' })
  ]);

  const sessoes = [...sessoesCompleted, ...sessoesHidden];
  console.log(`[Helena CRM] getEquipesPerformance: ${sessoes.length} sessões finalizadas`);

  const MAX_TEMPO_ATENDIMENTO_S = 8 * 3600;
  const MAX_TEMPO_ESPERA_S = 2 * 3600;

  const departamentos = await getDepartamentos();

  const statsMap = new Map<string, {
    total: number;
    temposEspera: number[];
    temposAtendimento: number[];
    temposPrimeiraResposta: number[];
  }>();

  for (const sessao of sessoes) {
    const nomeEquipe = resolverNomeEquipeFromSessao(sessao, departamentos);

    if (!statsMap.has(nomeEquipe)) {
      statsMap.set(nomeEquipe, { total: 0, temposEspera: [], temposAtendimento: [], temposPrimeiraResposta: [] });
    }

    const stats = statsMap.get(nomeEquipe)!;
    stats.total += 1;

    const tempoEspera = calcWaitSeconds(sessao);
    if (tempoEspera > 0 && tempoEspera <= MAX_TEMPO_ESPERA_S) {
      stats.temposEspera.push(tempoEspera);
    }

    const tempoAtendimento = calcServiceSeconds(sessao);
    if (tempoAtendimento > 0 && tempoAtendimento <= MAX_TEMPO_ATENDIMENTO_S) {
      stats.temposAtendimento.push(tempoAtendimento);
    }

    if (sessao.createdAt && sessao.startAt) {
      const primeiraResposta = Math.max(0, (new Date(sessao.startAt).getTime() - new Date(sessao.createdAt).getTime()) / 1000);
      if (primeiraResposta > 0 && primeiraResposta <= MAX_TEMPO_ESPERA_S) {
        stats.temposPrimeiraResposta.push(primeiraResposta);
      }
    }
  }

  const resultado: EquipePerformanceHelena[] = [];
  for (const [equipe, stats] of statsMap.entries()) {
    const tempoEsperaMedio = stats.temposEspera.length > 0
      ? Math.round(stats.temposEspera.reduce((a, b) => a + b, 0) / stats.temposEspera.length)
      : 0;

    const tempoAtendimentoMedio = stats.temposAtendimento.length > 0
      ? Math.round(stats.temposAtendimento.reduce((a, b) => a + b, 0) / stats.temposAtendimento.length)
      : 0;

    const tempoPrimeiraRespostaMedio = stats.temposPrimeiraResposta.length > 0
      ? Math.round(stats.temposPrimeiraResposta.reduce((a, b) => a + b, 0) / stats.temposPrimeiraResposta.length)
      : 0;

    resultado.push({
      equipe,
      total: stats.total,
      tempoEsperaMedioSegundos: tempoEsperaMedio,
      tempoEsperaMedioFormatado: formatarTempo(tempoEsperaMedio),
      tempoAtendimentoMedioSegundos: tempoAtendimentoMedio,
      tempoAtendimentoMedioFormatado: formatarTempo(tempoAtendimentoMedio),
      tempoPrimeiraRespostaMedioSegundos: tempoPrimeiraRespostaMedio,
      tempoPrimeiraRespostaMedioFormatado: formatarTempo(tempoPrimeiraRespostaMedio),
    });
  }

  return resultado.sort((a, b) => b.total - a.total);
}

async function getSessoes(filtro: FiltroHelena = {}): Promise<SessaoHelena[]> {
  if (!filtro.status) {
    const [completed, hidden] = await Promise.all([
      buscarTodasSessoes({ ...filtro, status: 'COMPLETED' }),
      buscarTodasSessoes({ ...filtro, status: 'HIDDEN' })
    ]);
    return [...completed, ...hidden];
  }
  return buscarTodasSessoes(filtro);
}

async function getClassificacoes(filtro: FiltroHelena = {}): Promise<ClassificacoesHelenaResponse> {
  // Buscar sessões COMPLETED e HIDDEN separadamente se necessário, 
  // ou buscar todas e filtrar localmente para garantir que não perdemos nada
  console.log(`[Helena CRM] getClassificacoes iniciado. Filtro:`, JSON.stringify(filtro));
  
  const [sessoesCompleted, sessoesHidden] = await Promise.all([
    buscarTodasSessoes({ ...filtro, status: 'COMPLETED' }),
    buscarTodasSessoes({ ...filtro, status: 'HIDDEN' })
  ]);

  const sessoes = [...sessoesCompleted, ...sessoesHidden];
  console.log(`[Helena CRM] getClassificacoes: ${sessoes.length} sessões finalizadas (COMPLETED=${sessoesCompleted.length}, HIDDEN=${sessoesHidden.length})`);

  if (sessoes.length > 0) {
    const statusCounts = sessoes.reduce((acc: any, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    console.log(`[Helena CRM] Status das sessões encontradas:`, statusCounts);
  }

  const contagemCategorias = new Map<string, number>();
  const contagemPorAgente = new Map<string, Map<string, number>>();

  const agentes = await getAgentes();

  let comClassificacao = 0;
  let semClassificacao = 0;
  let formatosDiferentes = 0;

  for (const sessao of sessoes) {
    // Tentar encontrar classificação em diferentes campos possíveis
    const s = sessao as any;
    let classification = s.classification || s.tabulation || s.category || s.objective;
    
    // Tentar campos alternativos se os principais falharem
    if (!classification) {
      classification = s.tabulations?.[0] || s.classifications?.[0] || s.categories?.[0];
    }

    // Se ainda não encontrou, mas tem objectiveName ou tabulationName
    if (!classification && (s.objectiveName || s.tabulationName)) {
      classification = { 
        categoryName: s.objectiveName || s.tabulationName,
        categoryDescription: s.objectiveDescription || s.tabulationDescription || ''
      };
    }

    // Se não encontrou nos campos padrão, tenta procurar dentro de 'tags'
    if (!classification && s.tags && Array.isArray(s.tags) && s.tags.length > 0) {
      // Se houver tags, tenta usar a primeira tag como classificação se ela parecer uma
      classification = { categoryName: 'Tags', categoryDescription: s.tags.join(', ') };
    }

    if (!classification) {
      semClassificacao++;
      continue;
    }

    let categoria = 'Sem categoria';
    let descricao = '';

    if (typeof classification === 'string') {
      categoria = classification;
    } else if (typeof classification === 'object') {
      categoria = classification.categoryName || classification.category || classification.name || classification.label || 'Sem categoria';
      descricao = classification.categoryDescription || classification.description || '';
      
      // Se categoria ainda for 'Sem categoria' e o objeto tiver outros campos
      if (categoria === 'Sem categoria' && Object.keys(classification).length > 0) {
        // Tenta pegar o primeiro valor de string do objeto como categoria
        const firstString = Object.values(classification).find(v => typeof v === 'string' && v.length > 2);
        if (firstString) categoria = firstString as string;
      }
    }

    comClassificacao++;
    const chave = descricao ? `${categoria} · ${descricao}` : categoria;

    contagemCategorias.set(chave, (contagemCategorias.get(chave) ?? 0) + 1);

    const nomeAgente = resolverNomeAgente(agentes, sessao.userId);
    if (!contagemPorAgente.has(nomeAgente)) {
      contagemPorAgente.set(nomeAgente, new Map());
    }
    const mapaAgente = contagemPorAgente.get(nomeAgente)!;
    mapaAgente.set(chave, (mapaAgente.get(chave) ?? 0) + 1);
  }

  console.log(`[Helena CRM] Resultado getClassificacoes:`);
  console.log(`  - Total analisado: ${sessoes.length}`);
  console.log(`  - Com classificação: ${comClassificacao}`);
  console.log(`  - Sem classificação: ${semClassificacao}`);
  if (formatosDiferentes > 0) console.log(`  - Formatos inválidos: ${formatosDiferentes}`);

  const totalClassificados = Array.from(contagemCategorias.values()).reduce((a, b) => a + b, 0);

  const classificacoes: ClassificacaoHelena[] = Array.from(contagemCategorias.entries())
    .map(([categoria, total]) => ({
      categoria,
      total,
      percentual: totalClassificados > 0 ? Math.round((total / totalClassificados) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const porAgente: ClassificacaoHelenaPorAgente[] = [];
  for (const [agente, mapa] of contagemPorAgente.entries()) {
    for (const [categoria, total] of mapa.entries()) {
      porAgente.push({ agente, categoria, total });
    }
  }
  porAgente.sort((a, b) => b.total - a.total);

  return {
    total: totalClassificados,
    totalFinalizados: sessoes.length,
    classificacoes,
    porAgente,
  };
}

function invalidateRealtimeCache(): void {
  cacheRealtime = null;
}

export const helenaService = {
  getKPIsTempoReal,
  getKPIsFinalizados,
  getAgentesPerformance,
  getEquipesPerformance,
  getSessoes,
  getClassificacoes,
  getDepartamentos,
  invalidateRealtimeCache,
  processarWebhook,
};
