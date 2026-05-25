import { KPIOverview, TimelineData, EquipeStats, AgenteStats, CanalStats, FiltroData, PicoHorarioData, ClassificacaoStats, ClassificacaoPorAgente, FiltroClassificacao, KPIsTempoReal, KPIsFinalizadosHelena, ClassificacoesHelenaResponse, AgentePerformanceHelena, EquipePerformanceHelena } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function buildQueryString(filtro: FiltroData): string {
  const params = new URLSearchParams();
  params.append('dataInicio', filtro.dataInicio);
  params.append('dataFim', filtro.dataFim);
  if (filtro.excluirEquipeAtivo) {
    params.append('excluirEquipeAtivo', 'true');
  }
  return params.toString();
}

function buildQueryStringClassificacao(filtro: FiltroClassificacao): string {
  const params = new URLSearchParams();
  params.append('dataInicio', filtro.dataInicio);
  params.append('dataFim', filtro.dataFim);
  if (filtro.classificacao) {
    params.append('classificacao', filtro.classificacao);
  }
  return params.toString();
}

export const api = {
  async getOverview(filtro: FiltroData): Promise<KPIOverview> {
    const response = await fetch(`${API_URL}/kpis/overview?${buildQueryString(filtro)}`);
    if (!response.ok) throw new Error('Erro ao buscar overview');
    return response.json();
  },

  async getTimeline(filtro: FiltroData): Promise<TimelineData[]> {
    const response = await fetch(`${API_URL}/kpis/timeline?${buildQueryString(filtro)}`);
    if (!response.ok) throw new Error('Erro ao buscar timeline');
    return response.json();
  },

  async getEquipes(filtro: FiltroData): Promise<EquipeStats[]> {
    const response = await fetch(`${API_URL}/kpis/equipes?${buildQueryString(filtro)}`);
    if (!response.ok) throw new Error('Erro ao buscar equipes');
    return response.json();
  },

  async getAgentes(filtro: FiltroData): Promise<AgenteStats[]> {
    const response = await fetch(`${API_URL}/kpis/agentes?${buildQueryString(filtro)}`);
    if (!response.ok) throw new Error('Erro ao buscar agentes');
    return response.json();
  },

  async getCanais(filtro: FiltroData): Promise<CanalStats[]> {
    const response = await fetch(`${API_URL}/kpis/canais?${buildQueryString(filtro)}`);
    if (!response.ok) throw new Error('Erro ao buscar canais');
    return response.json();
  },

  async getPicosHorario(filtro: FiltroData): Promise<PicoHorarioData[]> {
    const response = await fetch(`${API_URL}/kpis/picos-horario?${buildQueryString(filtro)}`);
    if (!response.ok) throw new Error('Erro ao buscar picos por horário');
    return response.json();
  },

  async getClassificacoes(filtro: FiltroClassificacao): Promise<ClassificacaoStats[]> {
    const response = await fetch(`${API_URL}/kpis/classificacoes?${buildQueryStringClassificacao(filtro)}`);
    if (!response.ok) throw new Error('Erro ao buscar classificações');
    return response.json();
  },

  async getClassificacoesPorAgente(filtro: FiltroClassificacao): Promise<ClassificacaoPorAgente[]> {
    const response = await fetch(`${API_URL}/kpis/classificacoes-por-agente?${buildQueryStringClassificacao(filtro)}`);
    if (!response.ok) throw new Error('Erro ao buscar classificações por agente');
    return response.json();
  },

  async getTodasClassificacoes(filtro: FiltroData): Promise<string[]> {
    const response = await fetch(`${API_URL}/kpis/todas-classificacoes?${buildQueryString(filtro)}`);
    if (!response.ok) throw new Error('Erro ao buscar lista de classificações');
    return response.json();
  },

  async getHelenaRealtime(): Promise<KPIsTempoReal> {
    const response = await fetch(`${API_URL}/helena/realtime`);
    if (!response.ok) throw new Error('Erro ao buscar KPIs em tempo real');
    return response.json();
  },

  async getHelenaFinalizados(dataInicio: string, dataFim: string): Promise<KPIsFinalizadosHelena> {
    const params = new URLSearchParams({ dataInicio, dataFim });
    const response = await fetch(`${API_URL}/helena/finalizados?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar atendimentos finalizados');
    return response.json();
  },

  async getHelenaClassificacoes(dataInicio: string, dataFim: string): Promise<ClassificacoesHelenaResponse> {
    const params = new URLSearchParams({ dataInicio, dataFim });
    const response = await fetch(`${API_URL}/helena/classificacoes?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar classificações da Helena');
    return response.json();
  },

  async getHelenaAgentes(dataInicio: string, dataFim: string): Promise<AgentePerformanceHelena[]> {
    const params = new URLSearchParams({ dataInicio, dataFim });
    const response = await fetch(`${API_URL}/helena/agentes?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar desempenho dos agentes');
    return response.json();
  },

  async getHelenaEquipes(dataInicio: string, dataFim: string): Promise<EquipePerformanceHelena[]> {
    const params = new URLSearchParams({ dataInicio, dataFim });
    const response = await fetch(`${API_URL}/helena/equipes?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar desempenho das equipes');
    return response.json();
  },
};
