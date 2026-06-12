import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { ResumoFunilCRM } from '../types';

export function useCRMFunil() {
  const [funil, setFunil] = useState<ResumoFunilCRM | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pesquisado, setPesquisado] = useState(false);
  const [minPecas, setMinPecas] = useState<number | undefined>(undefined);
  const [etapa, setEtapa] = useState<string | undefined>(undefined);

  const fetchFunil = useCallback(async (qtd?: number, stepId?: string) => {
    setLoading(true);
    setError(null);
    setPesquisado(true);
    try {
      const data = await api.getCRMFunil(qtd, stepId);
      setFunil(data);
    } catch (err) {
      console.error('[CRM] Erro ao buscar funil:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar funil CRM');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunil(minPecas, etapa);
  }, [fetchFunil, minPecas, etapa]);

  return {
    funil,
    loading,
    error,
    pesquisado,
    minPecas,
    setMinPecas,
    etapa,
    setEtapa,
    fetchFunil,
  };
}
