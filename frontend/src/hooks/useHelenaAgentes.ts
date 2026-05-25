import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { AgentePerformanceHelena } from '../types';

export function useHelenaAgentes() {
  const [agentes, setAgentes] = useState<AgentePerformanceHelena[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pesquisado, setPesquisado] = useState(false);

  const fetchAgentes = useCallback(async (dataInicio: string, dataFim: string) => {
    setLoading(true);
    setError(null);
    setPesquisado(true);
    try {
      const data = await api.getHelenaAgentes(dataInicio, dataFim);
      setAgentes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar desempenho dos agentes');
    } finally {
      setLoading(false);
    }
  }, []);

  return { agentes, loading, error, pesquisado, fetchAgentes };
}
