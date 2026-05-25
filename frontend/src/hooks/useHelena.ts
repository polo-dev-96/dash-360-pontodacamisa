import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { KPIsTempoReal, KPIsFinalizadosHelena, ClassificacoesHelenaResponse } from '../types';

// Polling de fallback: 30s
const INTERVALO_FALLBACK_MS = 30_000;
const INTERVALO_SEM_SSE_MS = 30_000;

export function useHelena() {
  const [realtime, setRealtime] = useState<KPIsTempoReal | null>(null);
  const [finalizados, setFinalizados] = useState<KPIsFinalizadosHelena | null>(null);
  const [classificacoes, setClassificacoes] = useState<ClassificacoesHelenaResponse | null>(null);
  const [loadingRealtime, setLoadingRealtime] = useState(false);
  const [loadingFinalizados, setLoadingFinalizados] = useState(false);
  const [loadingClassificacoes, setLoadingClassificacoes] = useState(false);
  const [errorRealtime, setErrorRealtime] = useState<string | null>(null);
  const [errorFinalizados, setErrorFinalizados] = useState<string | null>(null);
  const [errorClassificacoes, setErrorClassificacoes] = useState<string | null>(null);
  const [pesquisadoFinalizados, setPesquisadoFinalizados] = useState(false);
  const [pesquisadoClassificacoes, setPesquisadoClassificacoes] = useState(false);
  const [sseAtivo, setSseAtivo] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);
  const visibleRef = useRef(true);
  const sseAtivoRef = useRef(false);

  const fetchRealtime = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoadingRealtime(true);
    setErrorRealtime(null);
    try {
      const data = await api.getHelenaRealtime();
      setRealtime(data);
    } catch (err) {
      console.error('[Helena] ❌ Erro no fetchRealtime:', err);
      setErrorRealtime(err instanceof Error ? err.message : 'Erro ao buscar dados em tempo real');
    } finally {
      setLoadingRealtime(false);
      fetchingRef.current = false;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const intervalo = sseAtivoRef.current ? INTERVALO_FALLBACK_MS : INTERVALO_SEM_SSE_MS;
    timeoutRef.current = setTimeout(async () => {
      if (!visibleRef.current) {
        scheduleNext();
        return;
      }
      await fetchRealtime();
      scheduleNext();
    }, intervalo);
  }, [fetchRealtime]);

  const fetchFinalizados = useCallback(async (dataInicio: string, dataFim: string) => {
    setLoadingFinalizados(true);
    setErrorFinalizados(null);
    setPesquisadoFinalizados(true);
    try {
      const data = await api.getHelenaFinalizados(dataInicio, dataFim);
      setFinalizados(data);
    } catch (err) {
      setErrorFinalizados(err instanceof Error ? err.message : 'Erro ao buscar atendimentos finalizados');
    } finally {
      setLoadingFinalizados(false);
    }
  }, []);

  const fetchClassificacoes = useCallback(async (dataInicio: string, dataFim: string) => {
    setLoadingClassificacoes(true);
    setErrorClassificacoes(null);
    setPesquisadoClassificacoes(true);
    try {
      const data = await api.getHelenaClassificacoes(dataInicio, dataFim);
      setClassificacoes(data);
    } catch (err) {
      setErrorClassificacoes(err instanceof Error ? err.message : 'Erro ao buscar classificações');
    } finally {
      setLoadingClassificacoes(false);
    }
  }, []);

  // ── SSE: recebe push da Helena via webhook ──
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function conectarSSE() {
      es = new EventSource('/api/helena/events');

      es.onopen = () => {
        console.log('[Helena SSE] ✅ Conectado');
        sseAtivoRef.current = true;
        setSseAtivo(true);
      };

      es.onmessage = (evt) => {
        try {
          const dados = JSON.parse(evt.data);
          if (dados.type === 'realtime' && dados.data) {
            console.log(`[Helena SSE] 📊 KPIs via webhook: emEspera=${dados.data.emEspera} emAtendimento=${dados.data.emAtendimento}`);
            setRealtime(dados.data);
          } else if (dados.type === 'webhook') {
            console.log(`[Helena SSE] 🔔 Evento genérico recebido: ${dados.event} — consultando API...`);
            fetchRealtime();
          }
        } catch {
          // ignora mensagens malformadas
        }
      };

      es.onerror = () => {
        console.warn('[Helena SSE] ⚠️ Conexão perdida. Reconectando em 10s...');
        sseAtivoRef.current = false;
        setSseAtivo(false);
        es?.close();
        reconnectTimer = setTimeout(conectarSSE, 10_000);
      };
    }

    conectarSSE();

    return () => {
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      sseAtivoRef.current = false;
      setSseAtivo(false);
    };
  }, [fetchRealtime]);

  useEffect(() => {
    fetchRealtime();
    scheduleNext();

    const onVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible';
      if (visibleRef.current && !fetchingRef.current) {
        fetchRealtime();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchRealtime, scheduleNext]);

  return {
    realtime,
    finalizados,
    classificacoes,
    loadingRealtime,
    loadingFinalizados,
    loadingClassificacoes,
    errorRealtime,
    errorFinalizados,
    errorClassificacoes,
    pesquisadoFinalizados,
    pesquisadoClassificacoes,
    sseAtivo,
    fetchRealtime,
    fetchFinalizados,
    fetchClassificacoes,
  };
}
