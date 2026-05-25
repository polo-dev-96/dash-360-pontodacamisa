import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { KPIOverview, TimelineData, EquipeStats, AgenteStats, CanalStats, PicoHorarioData, FiltroData } from '../types';

export function useKPIs(filtro: FiltroData) {
  const [overview, setOverview] = useState<KPIOverview | null>(null);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [equipes, setEquipes] = useState<EquipeStats[]>([]);
  const [agentes, setAgentes] = useState<AgenteStats[]>([]);
  const [canais, setCanais] = useState<CanalStats[]>([]);
  const [picosHorario, setPicosHorario] = useState<PicoHorarioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, timelineData, equipesData, agentesData, canaisData, picosHorarioData] = await Promise.all([
        api.getOverview(filtro),
        api.getTimeline(filtro),
        api.getEquipes(filtro),
        api.getAgentes(filtro),
        api.getCanais(filtro),
        api.getPicosHorario(filtro),
      ]);
      setOverview(overviewData);
      setTimeline(timelineData);
      setEquipes(equipesData);
      setAgentes(agentesData);
      setCanais(canaisData);
      setPicosHorario(picosHorarioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { overview, timeline, equipes, agentes, canais, picosHorario, loading, error, refetch: fetchData };
}
