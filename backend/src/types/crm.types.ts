export interface CardCRM {
  id: string;
  title?: string;
  description?: string;
  key?: string;
  number?: number;
  stageId: string;
  stageName: string;
  responsibleName?: string;
  responsibleId?: string;
  contactName?: string;
  contactId?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  isOverdue?: boolean;
  monetaryAmount?: number;
  status?: 'OPEN' | 'WON' | 'LOST' | 'ARCHIVED';
  lostReasonName?: string;
  tagIds?: string[];
  tagNames?: string[];
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EtapaFunil {
  id: string;
  nome: string;
  tipo: 'inicio' | 'intermediario' | 'final';
  total: number;
  cards: CardCRM[];
}

export interface ResumoFunilCRM {
  panelId: string;
  totalCards: number;
  etapas: EtapaFunil[];
  porResponsavel: { nome: string; total: number }[];
  atualizadoEm: string;
}
