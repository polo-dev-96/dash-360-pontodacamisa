import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { ClassificacaoStats, ClassificacaoPorAgente, FiltroClassificacao } from '../types';

export function useClassificacoes() {
  const [classificacoes, setClassificacoes] = useState<ClassificacaoStats[]>([]);
  const [classificacoesPorAgente, setClassificacoesPorAgente] = useState<ClassificacaoPorAgente[]>([]);
  const [todasClassificacoes, setTodasClassificacoes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pesquisado, setPesquisado] = useState(false);

  const search = useCallback(async (filtro: FiltroClassificacao) => {
    setLoading(true);
    setError(null);
    setPesquisado(true);
    
    try {
      const classificacoesData = await api.getClassificacoes(filtro);
      const porAgenteData = await api.getClassificacoesPorAgente(filtro);
      const listaClassificacoes = await api.getTodasClassificacoes(filtro);
      
      setClassificacoes(classificacoesData);
      setClassificacoesPorAgente(porAgenteData);
      setTodasClassificacoes(listaClassificacoes);
    } catch (err) {
      console.error('Erro ao buscar classificações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    classificacoes, 
    classificacoesPorAgente, 
    todasClassificacoes, 
    loading, 
    error,
    pesquisado,
    search,
  };
}
