export interface KPIOverview {
  totalAtendimentos: number;
  concluidos: number;
  pendentes: number;
  tempoEsperaMedioSegundos: number;
  tempoAtendimentoMedioSegundos: number;
  tempoEsperaFormatado: string;
  tempoAtendimentoFormatado: string;
}

export interface TimelineData {
  data: string;
  total: number;
  concluidos: number;
  tempoEsperaMedio: number;
  tempoAtendimentoMedio: number;
}

export interface EquipeStats {
  equipe: string;
  total: number;
  tempoMedioSegundos: number;
  tempoMedioFormatado: string;
  tempoEsperaMedioSegundos: number;
  tempoEsperaMedioFormatado: string;
}

export interface AgenteStats {
  agente: string;
  total: number;
  tempoMedioSegundos: number;
  tempoMedioFormatado: string;
  tempoPrimeiraRespostaSegundos: number;
  tempoPrimeiraRespostaFormatado: string;
}

export interface NumeroCanalStats {
  numero: string;
  total: number;
  percentual: number;
}

export interface CanalStats {
  canal: string;
  total: number;
  percentual: number;
  numeros?: NumeroCanalStats[];
}

export interface FiltroData {
  dataInicio: string;
  dataFim: string;
  excluirEquipeAtivo?: boolean;
}

export interface PicoHorarioData {
  hora: number;
  total: number;
}

export interface FiltroClassificacao extends FiltroData {
  classificacao?: string;
}

export interface ClassificacaoStats {
  classificacao: string;
  total: number;
  percentual: number;
}

export interface ClassificacaoPorAgente {
  agente: string;
  classificacao: string;
  total: number;
}

export interface KPIsTempoReal {
  emEspera: number;
  emAtendimento: number;
  total: number;
  porEquipe: { equipe: string; total: number }[];
  porCanal: { canal: string; total: number }[];
  atualizadoEm: string;
}

export interface KPIsFinalizadosHelena {
  total: number;
  tempoEsperaMedioSegundos: number;
  tempoAtendimentoMedioSegundos: number;
  tempoEsperaFormatado: string;
  tempoAtendimentoFormatado: string;
  porCanal: { canal: string; total: number }[];
  porAgente: { agente: string; total: number }[];
  porEquipe: { equipe: string; total: number }[];
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
