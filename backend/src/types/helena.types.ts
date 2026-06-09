export type StatusSessao = 'UNDEFINED' | 'STARTED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'HIDDEN';

export interface SessaoHelena {
  id: string;
  type?: string;
  status: StatusSessao;
  channelId: string;
  departmentId?: string;
  userId?: string;
  contactId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  startAt?: string;
  endAt?: string;
  number?: string;
  previewUrl?: string;
  timeWait?: string;
  timeService?: string;
  [key: string]: unknown;
}

export interface RespostaHelenaSession {
  items: SessaoHelena[];
  totalItems?: number;
  totalPages?: number;
  hasMorePages?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface KPIsTempoReal {
  emEspera: number;
  emAtendimento: number;
  total: number;
  porEquipe: { equipe: string; total: number }[];
  porCanal: { canal: string; total: number }[];
  atualizadoEm: string;
}

export interface KPIsFinalizados {
  total: number;
  sessoesFinalizadas: SessaoHelena[];
  tempoEsperaMedioSegundos: number;
  tempoAtendimentoMedioSegundos: number;
  tempoEsperaFormatado: string;
  tempoAtendimentoFormatado: string;
  porCanal: { canal: string; total: number }[];
  porAgente: { agente: string; total: number }[];
  porEquipe: { equipe: string; total: number }[];
}

export interface FiltroHelena {
  status?: StatusSessao;
  dataInicio?: string;
  dataFim?: string;
  startAtInicio?: string;
  startAtFim?: string;
  equipe?: string;
  canal?: string;
}

export interface DepartamentoHelena {
  id: string;
  name: string;
}

export interface AgenteHelena {
  id: string;
  name: string;
}

export interface ClassificacaoHelena {
  categoria: string;
  total: number;
  percentual: number;
}

export interface ClassificacaoHelenaPorAgente {
  agente: string;
  categoria: string;
  total: number;
}

export interface AgentePerformanceHelena {
  agente: string;
  total: number;
  tempoEsperaMedioSegundos: number;
  tempoEsperaMedioFormatado: string;
  tempoAtendimentoMedioSegundos: number;
  tempoAtendimentoMedioFormatado: string;
  tempoPrimeiraRespostaMedioSegundos: number;
  tempoPrimeiraRespostaMedioFormatado: string;
}

export interface EquipePerformanceHelena {
  equipe: string;
  total: number;
  tempoEsperaMedioSegundos: number;
  tempoEsperaMedioFormatado: string;
  tempoAtendimentoMedioSegundos: number;
  tempoAtendimentoMedioFormatado: string;
  tempoPrimeiraRespostaMedioSegundos: number;
  tempoPrimeiraRespostaMedioFormatado: string;
}

export interface ClassificacoesHelenaResponse {
  total: number;
  totalFinalizados: number;
  classificacoes: ClassificacaoHelena[];
  porAgente: ClassificacaoHelenaPorAgente[];
}
