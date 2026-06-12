import { CardCRM, EtapaFunil, ResumoFunilCRM } from '../types/crm.types';

const CRM_URL = 'https://api.helena.run/crm';

let tagsCache: Map<string, string> | null = null;
let tagsCacheTime = 0;
const TAGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

const ETAPAS = [
  { id: 'defb26bb-9f51-49ee-b07f-a82ad940db0b', nome: 'ATENDIMENTO EM ANDAMENTO', tipo: 'inicio' as const },
  { id: 'a6453a6c-2fc8-4e6f-82ad-bc25ed7b45c4', nome: 'AGUARDANDO PAGAMENTO', tipo: 'intermediario' as const },
  { id: '21e5858b-64af-4cad-b88f-d8caecb6ccae', nome: 'LAYOUT PENDENTE', tipo: 'intermediario' as const },
  { id: '12592f88-940a-4930-859d-f29f361d190c', nome: 'PAMENTO EFETUADO', tipo: 'intermediario' as const },
  { id: '1708d8a4-dfca-42d6-8dd0-50cb8803af32', nome: 'RECUPERAÇÃO', tipo: 'intermediario' as const },
  { id: '5899d71b-d68b-4fa8-80d3-5bab366d9008', nome: 'RECLAMAÇÃO', tipo: 'intermediario' as const },
  { id: 'fbbbe3dd-2ba8-4010-8b95-d9decde21a68', nome: 'SEM INTERAÇÃO', tipo: 'intermediario' as const },
  { id: '6b518c26-b586-4c8d-a581-661ab6539ade', nome: 'EXPEDIÇÃO', tipo: 'final' as const },
];

const PANEL_ID = '9a2d980b-246e-403a-a942-2cf3670fe2b7';

function getToken(): string {
  const token = process.env.HELENA_CRM_TOKEN;
  if (!token) {
    throw new Error('HELENA_CRM_TOKEN não configurado no .env');
  }
  return token;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPanelTags(): Promise<Map<string, string>> {
  if (tagsCache && Date.now() - tagsCacheTime < TAGS_CACHE_TTL_MS) {
    return tagsCache;
  }

  const token = getToken();
  const url = `${CRM_URL}/v2/panel/${PANEL_ID}/tag`;
  const map = new Map<string, string>();

  try {
    console.log(`[CRM Service] Buscando tags: ${url}`);
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[CRM Service] Erro ao buscar tags: ${res.status} body: ${body.slice(0, 200)}`);
      tagsCache = map;
      tagsCacheTime = Date.now();
      return map;
    }

    const data = await res.json() as any;
    console.log(`[CRM Service] Tags response keys: ${Object.keys(data).join(',')}`);
    const lista = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
    console.log(`[CRM Service] Tags count: ${lista.length}`);
    for (const tag of lista) {
      if (tag.id && tag.name) {
        map.set(tag.id, tag.name);
      } else if (tag.id) {
        map.set(tag.id, tag.title || tag.label || tag.id);
      }
    }
    console.log(`[CRM Service] Tags carregadas: ${map.size}`);
  } catch (err: any) {
    console.warn(`[CRM Service] Falha ao buscar tags: ${err?.message}`);
  }

  tagsCache = map;
  tagsCacheTime = Date.now();
  return map;
}

async function fetchCardsByStage(stepId: string): Promise<CardCRM[]> {
  await fetchPanelTags(); // garante cache de tags populado
  const token = getToken();
  const url = `${CRM_URL}/v2/panel/card?PanelId=${PANEL_ID}&StepId=${stepId}&PageSize=100&IncludeDetails=ResponsibleUser&IncludeDetails=Contacts&IncludeDetails=StepTitle&IncludeDetails=StepPhase&IncludeDetails=CustomFields`;

  const todosCards: CardCRM[] = [];
  let pageNumber = 1;
  let hasMore = true;

  while (hasMore && pageNumber <= 10) {
    const paginatedUrl = `${url}&PageNumber=${pageNumber}`;
    try {
      console.log(`[CRM Service] GET ${paginatedUrl}`);
      const res = await fetchWithTimeout(paginatedUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.warn(`[CRM Service] Erro ${res.status} etapa ${stepId}: ${body}`);
        break;
      }

      const data = await res.json() as any;
      console.log(`[CRM Service] Etapa ${stepId} p${pageNumber} keys: ${Object.keys(data).join(',')} totalItems:${data.totalItems}`);

      const lista = Array.isArray(data.items) ? data.items : [];
      todosCards.push(...lista.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        key: item.key,
        number: item.number,
        stageId: item.stepId,
        stageName: item.stepTitle || ETAPAS.find(e => e.id === item.stepId)?.nome || item.stepId,
        responsibleName: item.responsibleUser?.name,
        responsibleId: item.responsibleUser?.id,
        contactName: item.contacts?.[0]?.name,
        contactId: item.contacts?.[0]?.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        dueDate: item.dueDate,
        isOverdue: item.isOverdue,
        monetaryAmount: item.monetaryAmount,
        status: item.status,
        lostReasonName: item.lostReason?.name,
        tagIds: item.tagIds,
        tagNames: item.tagIds?.map((id: string) => tagsCache?.get(id) || id),
        customFields: item.customFields,
        metadata: item.metadata,
      })));

      hasMore = !!data.hasMorePages;
      pageNumber++;
    } catch (err: any) {
      console.error(`[CRM Service] Erro etapa ${stepId}:`, err?.message || err);
      break;
    }
  }

  console.log(`[CRM Service] Etapa ${stepId} total cards acumulados: ${todosCards.length}`);
  return todosCards;
}

async function getResumoFunilCRM(minPecas?: number): Promise<ResumoFunilCRM> {
  console.log('[CRM Service] Iniciando busca do funil...', minPecas ? `(minPecas: ${minPecas})` : '');

  const resultados = await Promise.all(
    ETAPAS.map(async (etapa) => {
      let cards = await fetchCardsByStage(etapa.id);
      if (minPecas !== undefined && !isNaN(minPecas)) {
        cards = cards.filter((c) => {
          const qtd = Number(c.customFields?.quantidadepecas);
          return !isNaN(qtd) && qtd >= minPecas;
        });
      }
      return {
        id: etapa.id,
        nome: etapa.nome,
        tipo: etapa.tipo,
        total: cards.length,
        cards,
      };
    })
  );

  const totalCards = resultados.reduce((sum, e) => sum + e.total, 0);
  console.log(`[CRM Service] Total cards no funil: ${totalCards}`);

  const responsavelMap = new Map<string, number>();
  for (const etapa of resultados) {
    for (const card of etapa.cards) {
      if (card.responsibleName) {
        responsavelMap.set(card.responsibleName, (responsavelMap.get(card.responsibleName) ?? 0) + 1);
      }
    }
  }

  const porResponsavel = Array.from(responsavelMap.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);

  return {
    panelId: PANEL_ID,
    totalCards,
    etapas: resultados,
    porResponsavel,
    atualizadoEm: new Date().toISOString(),
  };
}

export default {
  getResumoFunilCRM,
};
