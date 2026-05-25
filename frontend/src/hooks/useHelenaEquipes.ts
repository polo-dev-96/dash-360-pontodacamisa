import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { EquipePerformanceHelena } from '../types';

export function useHelenaEquipes() {
  const [equipes, setEquipes] = useState<EquipePerformanceHelena[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pesquisado, setPesquisado] = useState(false);

  const fetchEquipes = useCallback(async (dataInicio: string, dataFim: string) => {
    setLoading(true);
    setError(null);
    setPesquisado(true);
    try {
      const data = await api.getHelenaEquipes(dataInicio, dataFim);
      setEquipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar desempenho das equipes');
    } finally {
      setLoading(false);
    }
  }, []);

  return { equipes, loading, error, pesquisado, fetchEquipes };
}
