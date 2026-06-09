import { useState, useEffect } from 'react'
import { useHelena } from './hooks/useHelena'
import { useHelenaEquipes } from './hooks/useHelenaEquipes'
import { useHelenaAgentes } from './hooks/useHelenaAgentes'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Users,
  Headphones,
  TrendingUp,
  RefreshCw,
  Tag,
  Activity,
  PhoneCall,
  Hourglass,
  AlertCircle,
  CheckSquare2,
  BarChart3,
  Layers,
  Printer,
  Filter,
  Calendar,
} from 'lucide-react'
import logo from './logos/Logo Login 64x64.png'

const COLORS = ['#dc2626', '#6b7280', '#b91c1c', '#374151', '#ef4444', '#9ca3af']

function formatSeconds(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.round(totalSec % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

const NAV_ITEMS = [
  { id: 'monitoramento-geral',  label: 'Monitoramento Geral',  icon: Activity },
  { id: 'desempenho-equipes',  label: 'Desempenho Equipes',  icon: Layers },
  { id: 'desempenho-agentes',  label: 'Desempenho Agentes',  icon: BarChart3 },
  { id: 'classificacoes-helena', label: 'Classificações', icon: Tag },
]

const PAGE_TITLES: Record<string, string> = {
  'classificacoes-helena': 'Classificações',
  'monitoramento-geral':  'Monitoramento Geral',
  'desempenho-agentes':   'Desempenho Agentes',
  'desempenho-equipes':   'Desempenho por Equipes',
}

function App() {
  const [activeTab, setActiveTab] = useState('monitoramento-geral')

  const hoje = new Date().toISOString().split('T')[0]

  // Filtros do Monitoramento Geral (Helena CRM)
  const [helenaDataInicio, setHelenaDataInicio] = useState<string>(hoje)
  const [helenaDataFim, setHelenaDataFim] = useState<string>(hoje)
  const [helenaEquipeFiltro, setHelenaEquipeFiltro] = useState<string>('')
  const [helenaCanalFiltro, setHelenaCanalFiltro] = useState<string>('')

  // Filtros do Tempo Real
  const [realtimeEquipeFiltro, setRealtimeEquipeFiltro] = useState<string>('')
  const [realtimeCanalFiltro, setRealtimeCanalFiltro] = useState<string>('')
  const [realtimeDataInicio, setRealtimeDataInicio] = useState<string>(hoje)
  const [realtimeDataFim, setRealtimeDataFim] = useState<string>(hoje)
  const [realtimeTipoData, setRealtimeTipoData] = useState<'entrada' | 'atendimento'>('entrada')

  // Filtros de Classificações Helena
  const [helenaClassDataInicio, setHelenaClassDataInicio] = useState<string>('')
  const [helenaClassDataFim, setHelenaClassDataFim] = useState<string>('')

  // Filtros de Desempenho Equipes
  const [equipesDataInicio, setEquipesDataInicio] = useState<string>(hoje)
  const [equipesDataFim, setEquipesDataFim] = useState<string>(hoje)

  // Filtros de Desempenho Agentes
  const [agentesDataInicio, setAgentesDataInicio] = useState<string>(hoje)
  const [agentesDataFim, setAgentesDataFim] = useState<string>(hoje)

  const {
    realtime,
    finalizados,
    classificacoes: classificacoesHelena,
    loadingRealtime,
    loadingFinalizados,
    loadingClassificacoes: loadingClassificacoesHelena,
    errorRealtime,
    errorFinalizados,
    errorClassificacoes: errorClassificacoesHelena,
    pesquisadoFinalizados,
    pesquisadoClassificacoes: pesquisadoClassificacoesHelena,
    fetchRealtime,
    fetchFinalizados,
    fetchClassificacoes: fetchClassificacoesHelena,
  } = useHelena()

  const {
    equipes: equipesPerformance,
    loading: loadingEquipes,
    error: errorEquipes,
    pesquisado: pesquisadoEquipes,
    fetchEquipes,
  } = useHelenaEquipes()

  const {
    agentes: agentesPerformance,
    loading: loadingAgentes,
    error: errorAgentes,
    pesquisado: pesquisadoAgentes,
    fetchAgentes,
  } = useHelenaAgentes()

  // Carrega atendimentos finalizados do dia automaticamente ao abrir
  useEffect(() => {
    fetchFinalizados(helenaDataInicio, helenaDataFim, helenaEquipeFiltro || undefined, helenaCanalFiltro || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exportarPDF = () => {
    const originalTitle = document.title
    document.title = `Monitoramento_Geral_${helenaDataInicio}_${helenaDataFim}`
    window.print()
    document.title = originalTitle
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-64 bg-gray-900 flex flex-col fixed inset-y-0 left-0 z-50 print:hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
          <img src={logo} alt="Logo" className="w-12 h-12 object-contain flex-shrink-0 drop-shadow-lg" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Dashboard 360 Omni</p>
            <p className="text-gray-400 text-xs">Painel de Atendimentos</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
              </button>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-5 py-4 border-t border-gray-700">
          <p className="text-gray-500 text-xs">Polo Telecom 2026 © Todos os direitos reservados</p>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen print:ml-0">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{PAGE_TITLES[activeTab]}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Dashboard 360 Omni · Painel de Atendimentos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500 font-medium">Sistema online</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 py-6 print:ml-0">

          {/* ── Monitoramento Geral ── */}
          {activeTab === 'monitoramento-geral' && (
            <div className="space-y-6">

              {/* Cabeçalho de impressão */}
              <div className="hidden print:block mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Monitoramento Geral</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Dashboard 360 Omni · Painel de Atendimentos
                  {helenaDataInicio && helenaDataFim && (
                    <span> · Período: {format(new Date(helenaDataInicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(helenaDataFim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  )}
                </p>
              </div>

              {/* ── Tempo Real ── */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-600" />
                    <h2 className="text-base font-bold text-gray-900">Atendimentos em Tempo Real</h2>
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full print:hidden">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                      Ao vivo · atualiza a cada 30s
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {realtime && (
                      <span className="text-xs text-gray-400">
                        Atualizado às {new Date(realtime.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (realtimeTipoData === 'entrada') {
                          fetchRealtime(realtimeEquipeFiltro || undefined, realtimeCanalFiltro || undefined, realtimeDataInicio, realtimeDataFim)
                        } else {
                          fetchRealtime(realtimeEquipeFiltro || undefined, realtimeCanalFiltro || undefined, undefined, undefined, realtimeDataInicio, realtimeDataFim)
                        }
                      }}
                      disabled={loadingRealtime}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors print:hidden"
                      title="Atualizar agora"
                    >
                      <RefreshCw className={`w-4 h-4 text-gray-500 ${loadingRealtime ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Filtros Tempo Real */}
                <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 print:hidden">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-600">Filtrar por:</span>
                    <select
                      value={realtimeTipoData}
                      onChange={(e) => setRealtimeTipoData(e.target.value as 'entrada' | 'atendimento')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      <option value="entrada">Data de entrada</option>
                      <option value="atendimento">Data de início do atendimento</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">De:</span>
                    <input
                      type="date"
                      value={realtimeDataInicio}
                      onChange={(e) => setRealtimeDataInicio(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Até:</span>
                    <input
                      type="date"
                      value={realtimeDataFim}
                      onChange={(e) => setRealtimeDataFim(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-600">Equipe:</span>
                    <select
                      value={realtimeEquipeFiltro}
                      onChange={(e) => setRealtimeEquipeFiltro(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white min-w-[140px]"
                    >
                      <option value="">Todas</option>
                      {realtime?.porEquipe.map((item, idx) => (
                        <option key={idx} value={item.equipe}>{item.equipe}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-600">Canal:</span>
                    <select
                      value={realtimeCanalFiltro}
                      onChange={(e) => setRealtimeCanalFiltro(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white min-w-[140px]"
                    >
                      <option value="">Todos</option>
                      {realtime?.porCanal.map((item, idx) => (
                        <option key={idx} value={item.canal}>{item.canal}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (realtimeTipoData === 'entrada') {
                        fetchRealtime(realtimeEquipeFiltro || undefined, realtimeCanalFiltro || undefined, realtimeDataInicio, realtimeDataFim)
                      } else {
                        fetchRealtime(realtimeEquipeFiltro || undefined, realtimeCanalFiltro || undefined, undefined, undefined, realtimeDataInicio, realtimeDataFim)
                      }
                    }}
                    disabled={loadingRealtime}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {loadingRealtime ? 'Buscando...' : 'Pesquisar'}
                  </button>
                  {(realtimeEquipeFiltro || realtimeCanalFiltro) && (
                    <span className="text-xs text-gray-500 font-medium">
                      {realtimeEquipeFiltro ? `Equipe: ${realtimeEquipeFiltro}` : ''}
                      {realtimeEquipeFiltro && realtimeCanalFiltro ? ' · ' : ''}
                      {realtimeCanalFiltro ? `Canal: ${realtimeCanalFiltro}` : ''}
                    </span>
                  )}
                </div>

                {errorRealtime ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorRealtime}</span>
                  </div>
                ) : (
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
                      <div className="bg-amber-100 p-3 rounded-xl flex-shrink-0">
                        <Hourglass className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Em Espera</p>
                        <p className="text-xs text-amber-600 mt-0.5">PENDING</p>
                        <p className="text-3xl font-bold text-amber-800 mt-1">
                          {(realtime?.emEspera ?? 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                        <PhoneCall className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Em Atendimento</p>
                        <p className="text-xs text-blue-600 mt-0.5">IN_PROGRESS</p>
                        <p className="text-3xl font-bold text-blue-800 mt-1">
                          {(realtime?.emAtendimento ?? 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                      <div className="bg-gray-200 p-3 rounded-xl flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Ativo</p>
                        <p className="text-xs text-gray-500 mt-0.5">PENDING + IN_PROGRESS</p>
                        <p className="text-3xl font-bold text-gray-800 mt-1">
                          {(realtime?.total ?? 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Por Equipe (Tempo Real) */}
                  <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-red-600" />
                      <h3 className="text-sm font-bold text-gray-800">Atendimentos por Equipe (DepartmentId)</h3>
                    </div>
                    {realtime && realtime.porEquipe.length > 0 ? (
                      <div className="space-y-3">
                        {realtime.porEquipe.map((item, idx) => {
                          const maxVal = Math.max(...realtime.porEquipe.map(e => e.total))
                          const pct = maxVal > 0 ? Math.round((item.total / maxVal) * 100) : 0
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold text-gray-800 truncate">{item.equipe}</span>
                                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{item.total.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Sem dados para o período</p>
                    )}
                  </div>
                </>)}
              </div>

              {/* ── Finalizados ── */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckSquare2 className="w-5 h-5 text-red-600" />
                  <h2 className="text-base font-bold text-gray-900">Atendimentos Finalizados</h2>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 print:hidden">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-600">De:</span>
                    <input
                      type="date"
                      value={helenaDataInicio}
                      onChange={(e) => setHelenaDataInicio(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Até:</span>
                    <input
                      type="date"
                      value={helenaDataFim}
                      onChange={(e) => setHelenaDataFim(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-600">Equipe:</span>
                    <select
                      value={helenaEquipeFiltro}
                      onChange={(e) => setHelenaEquipeFiltro(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white min-w-[140px]"
                    >
                      <option value="">Todas</option>
                      {realtime?.porEquipe.map((item, idx) => (
                        <option key={idx} value={item.equipe}>{item.equipe}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-600">Canal:</span>
                    <select
                      value={helenaCanalFiltro}
                      onChange={(e) => setHelenaCanalFiltro(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white min-w-[140px]"
                    >
                      <option value="">Todos</option>
                      {finalizados?.porCanal.map((item, idx) => (
                        <option key={idx} value={item.canal}>{item.canal}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => fetchFinalizados(helenaDataInicio, helenaDataFim, helenaEquipeFiltro || undefined, helenaCanalFiltro || undefined)}
                    disabled={!helenaDataInicio || !helenaDataFim || loadingFinalizados}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {loadingFinalizados ? 'Buscando...' : 'Pesquisar'}
                  </button>
                  <button
                    onClick={exportarPDF}
                    disabled={!pesquisadoFinalizados}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Exportar PDF
                  </button>
                  {pesquisadoFinalizados && helenaDataInicio && helenaDataFim && (
                    <span className="text-xs text-gray-500 font-medium">
                      {format(new Date(helenaDataInicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(helenaDataFim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                      {helenaEquipeFiltro ? ` · Equipe: ${helenaEquipeFiltro}` : ''}
                      {helenaCanalFiltro ? ` · Canal: ${helenaCanalFiltro}` : ''}
                    </span>
                  )}
                </div>

                {!pesquisadoFinalizados ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                      <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-base font-medium">Nenhum período selecionado</p>
                    <p className="text-sm">Selecione um período e clique em <span className="font-semibold text-red-600">Pesquisar</span></p>
                  </div>
                ) : errorFinalizados ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorFinalizados}</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* KPI Cards finalizados */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-xl flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Total Finalizados</p>
                          <p className="text-3xl font-bold text-green-800 mt-1">
                            {loadingFinalizados ? '—' : (finalizados?.total ?? 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-xl flex-shrink-0">
                          <Clock className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Tempo Médio de Espera</p>
                          <p className="text-2xl font-bold text-red-800 mt-1">
                            {loadingFinalizados ? '—' : (finalizados?.tempoEsperaFormatado ?? '—')}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                        <div className="bg-gray-200 p-3 rounded-xl flex-shrink-0">
                          <TrendingUp className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tempo Médio de Atendimento</p>
                          <p className="text-2xl font-bold text-gray-800 mt-1">
                            {loadingFinalizados ? '—' : (finalizados?.tempoAtendimentoFormatado ?? '—')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Por Canal e Por Agente */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Por Canal */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-800 mb-4">Finalizados por Canal</h3>
                        {loadingFinalizados ? (
                          <p className="text-gray-400 text-sm">Carregando...</p>
                        ) : finalizados && finalizados.porCanal.length > 0 ? (
                          <div className="space-y-3">
                            {finalizados.porCanal.map((item, idx) => {
                              const maxVal = Math.max(...finalizados.porCanal.map(c => c.total))
                              const pct = maxVal > 0 ? Math.round((item.total / maxVal) * 100) : 0
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-semibold text-gray-800 truncate">{item.canal}</span>
                                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{item.total.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">Sem dados para o período</p>
                        )}
                      </div>

                      {/* Por Agente */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-800 mb-4">Finalizados por Agente</h3>
                        {loadingFinalizados ? (
                          <p className="text-gray-400 text-sm">Carregando...</p>
                        ) : finalizados && finalizados.porAgente.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Agente</th>
                                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Finalizados</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {finalizados.porAgente.slice(0, 15).map((item, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-2.5 font-medium text-gray-800 flex items-center gap-2">
                                      <img
                                        src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(item.agente)}&backgroundColor=fecaca,fed7aa,bbf7d0,bfdbfe,e9d5ff`}
                                        alt={item.agente}
                                        className="w-6 h-6 rounded-full border border-gray-200 bg-gray-100 flex-shrink-0"
                                      />
                                      {item.agente}
                                    </td>
                                    <td className="py-2.5 text-right font-bold text-gray-900">{item.total.toLocaleString('pt-BR')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">Sem dados para o período</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── Desempenho por Equipes ── */}
          {activeTab === 'desempenho-equipes' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">De:</span>
                    <input
                      type="date"
                      value={equipesDataInicio}
                      onChange={(e) => setEquipesDataInicio(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Até:</span>
                    <input
                      type="date"
                      value={equipesDataFim}
                      onChange={(e) => setEquipesDataFim(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <button
                    onClick={() => fetchEquipes(equipesDataInicio, equipesDataFim)}
                    disabled={!equipesDataInicio || !equipesDataFim || loadingEquipes}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {loadingEquipes ? 'Buscando...' : 'Pesquisar'}
                  </button>
                  {pesquisadoEquipes && equipesDataInicio && equipesDataFim && (
                    <span className="text-xs text-gray-500 font-medium">
                      {format(new Date(equipesDataInicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(equipesDataFim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>

              {!pesquisadoEquipes ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                    <Clock className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-base font-medium">Nenhum período selecionado</p>
                  <p className="text-sm">Selecione um período e clique em <span className="font-semibold text-red-600">Pesquisar</span></p>
                </div>
              ) : errorEquipes ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorEquipes}</span>
                </div>
              ) : (
                <div className="space-y-6">

                  {/* ── KPIs Globais (soma de todas as equipes) ── */}
                  {equipesPerformance.length > 0 && (() => {
                    const totalAtend = equipesPerformance.reduce((s, e) => s + e.total, 0)
                    const mediaEspera = equipesPerformance.length > 0
                      ? equipesPerformance.reduce((s, e) => s + e.tempoEsperaMedioSegundos, 0) / equipesPerformance.length
                      : 0
                    const mediaAtend = equipesPerformance.length > 0
                      ? equipesPerformance.reduce((s, e) => s + e.tempoAtendimentoMedioSegundos, 0) / equipesPerformance.length
                      : 0
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckSquare2 className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total de Atendimentos</span>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">{totalAtend.toLocaleString('pt-BR')}</p>
                          <p className="text-xs text-gray-400">soma de todas as equipes</p>
                        </div>
                        <div className="bg-white border border-red-200 rounded-xl shadow-sm p-5 flex flex-col gap-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Hourglass className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-red-600">Tempo Médio de Espera</span>
                          </div>
                          <p className="text-3xl font-bold text-red-700">{formatSeconds(mediaEspera)}</p>
                          <p className="text-xs text-gray-400">média · todas as equipes</p>
                        </div>
                        <div className="bg-white border border-red-200 rounded-xl shadow-sm p-5 flex flex-col gap-1">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-red-600">Tempo Médio de Atendimento</span>
                          </div>
                          <p className="text-3xl font-bold text-red-700">{formatSeconds(mediaAtend)}</p>
                          <p className="text-xs text-gray-400">média · todas as equipes</p>
                        </div>
                      </div>
                    )
                  })()}

                  {/* ── Gráfico moderno: Atendimentos por Equipe ── */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <Layers className="w-5 h-5 text-red-600" />
                      <h3 className="text-base font-bold text-gray-900">Atendimentos por Equipe</h3>
                      <span className="ml-auto text-xs text-gray-400 font-medium">Total no período</span>
                    </div>
                    {loadingEquipes ? (
                      <p className="text-gray-400 text-sm">Carregando...</p>
                    ) : equipesPerformance.length > 0 ? (
                      <div className="space-y-3">
                        {(() => {
                          const maxVal = Math.max(...equipesPerformance.map(e => e.total))
                          const totalGeral = equipesPerformance.reduce((s, e) => s + e.total, 0)
                          return equipesPerformance.map((item, idx) => {
                            const pct = maxVal > 0 ? Math.round((item.total / maxVal) * 100) : 0
                            const share = totalGeral > 0 ? ((item.total / totalGeral) * 100).toFixed(1) : '0'
                            const bg = idx === 0 ? '#dc2626' : idx === 1 ? '#b91c1c' : idx === 2 ? '#ef4444' : COLORS[idx % COLORS.length]
                            return (
                              <div key={idx} className="group">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: bg }}>
                                      {item.equipe.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800">{item.equipe}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400 font-medium">{share}%</span>
                                    <span className="text-sm font-bold text-gray-900 min-w-[2.5rem] text-right">{item.total.toLocaleString('pt-BR')}</span>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="h-2.5 rounded-full transition-all duration-700"
                                    style={{ width: `${pct}%`, backgroundColor: bg }}
                                  />
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Sem dados para o período</p>
                    )}
                  </div>

                  {/* ── KPIs de tempo médio por equipe ── */}
                  {equipesPerformance.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {equipesPerformance.map((item, idx) => {
                        const bg = idx === 0 ? 'bg-red-600' : 'bg-gray-700'
                        const bgLight = idx === 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                        const textAccent = idx === 0 ? 'text-red-700' : 'text-gray-700'
                        const textValue = idx === 0 ? 'text-red-900' : 'text-gray-900'
                        return (
                          <div key={idx} className={`border rounded-xl overflow-hidden shadow-sm ${bgLight}`}>
                            <div className={`px-5 py-3 flex items-center gap-2 ${bg}`}>
                              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                                {item.equipe.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-white">{item.equipe}</span>
                              <span className="ml-auto text-white/70 text-xs font-semibold">{item.total.toLocaleString('pt-BR')} atend.</span>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-gray-200">
                              <div className="p-5 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <TrendingUp className={`w-4 h-4 ${textAccent}`} />
                                  <span className={`text-xs font-semibold uppercase tracking-wide ${textAccent}`}>Tempo de Atendimento</span>
                                </div>
                                <p className={`text-2xl font-bold mt-1 ${textValue}`}>{item.tempoAtendimentoMedioFormatado}</p>
                                <p className="text-xs text-gray-400">tempo médio</p>
                              </div>
                              <div className="p-5 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Hourglass className={`w-4 h-4 ${textAccent}`} />
                                  <span className={`text-xs font-semibold uppercase tracking-wide ${textAccent}`}>Tempo de Espera</span>
                                </div>
                                <p className={`text-2xl font-bold mt-1 ${textValue}`}>{item.tempoEsperaMedioFormatado}</p>
                                <p className="text-xs text-gray-400">tempo médio</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Tabela Detalhada por Equipe */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <h2 className="text-base font-bold text-gray-900">Detalhamento por Equipe</h2>
                      <p className="text-xs text-gray-500 mt-1">Métricas agregadas de atendimentos finalizados no período selecionado.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipe</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Atendimentos</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Tempo Médio de Espera</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Tempo de Atendimento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {loadingEquipes ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Carregando...</td>
                            </tr>
                          ) : equipesPerformance.length > 0 ? (
                            equipesPerformance.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">
                                      {item.equipe.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-gray-900">{item.equipe}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900">{item.total.toLocaleString('pt-BR')}</td>
                                <td className="px-6 py-4 text-right text-gray-600">{item.tempoEsperaMedioFormatado}</td>
                                <td className="px-6 py-4 text-right text-gray-600">{item.tempoAtendimentoMedioFormatado}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Sem dados para o período selecionado</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Desempenho Agentes ── */}
          {activeTab === 'desempenho-agentes' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">De:</span>
                    <input
                      type="date"
                      value={agentesDataInicio}
                      onChange={(e) => setAgentesDataInicio(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Até:</span>
                    <input
                      type="date"
                      value={agentesDataFim}
                      onChange={(e) => setAgentesDataFim(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <button
                    onClick={() => fetchAgentes(agentesDataInicio, agentesDataFim)}
                    disabled={!agentesDataInicio || !agentesDataFim || loadingAgentes}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {loadingAgentes ? 'Buscando...' : 'Pesquisar'}
                  </button>
                  {pesquisadoAgentes && agentesDataInicio && agentesDataFim && (
                    <span className="text-xs text-gray-500 font-medium">
                      {format(new Date(agentesDataInicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(agentesDataFim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>

              {!pesquisadoAgentes ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                    <Clock className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-base font-medium">Nenhum período selecionado</p>
                  <p className="text-sm">Selecione um período e clique em <span className="font-semibold text-red-600">Pesquisar</span></p>
                </div>
              ) : errorAgentes ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorAgentes}</span>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-base font-bold text-gray-900">Qualidade do atendimento por agente</h2>
                    <p className="text-xs text-gray-500 mt-1">Foram considerados atendimentos finalizados no período selecionado.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Agente</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Atendimentos Concluídos</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Média de Espera</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Tempo de Atendimento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loadingAgentes ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Carregando...</td>
                          </tr>
                        ) : agentesPerformance.length > 0 ? (
                          agentesPerformance.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(item.agente)}&backgroundColor=fecaca,fed7aa,bbf7d0,bfdbfe,e9d5ff`}
                                    alt={item.agente}
                                    className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex-shrink-0"
                                  />
                                  <span className="font-medium text-gray-900">{item.agente}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-gray-900">{item.total.toLocaleString('pt-BR')}</td>
                              <td className="px-6 py-4 text-right text-gray-600">{item.tempoEsperaMedioFormatado}</td>
                              <td className="px-6 py-4 text-right text-gray-600">{item.tempoAtendimentoMedioFormatado}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Sem dados para o período selecionado</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Classificações Helena ── */}
          {activeTab === 'classificacoes-helena' && (
            <div className="space-y-6">
              {/* Filtro de datas */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">De:</span>
                    <input
                      type="date"
                      value={helenaClassDataInicio}
                      onChange={(e) => setHelenaClassDataInicio(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Até:</span>
                    <input
                      type="date"
                      value={helenaClassDataFim}
                      onChange={(e) => setHelenaClassDataFim(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <button
                    onClick={() => fetchClassificacoesHelena(helenaClassDataInicio, helenaClassDataFim)}
                    disabled={!helenaClassDataInicio || !helenaClassDataFim || loadingClassificacoesHelena}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {loadingClassificacoesHelena ? 'Buscando...' : 'Pesquisar'}
                  </button>
                  {pesquisadoClassificacoesHelena && helenaClassDataInicio && helenaClassDataFim && (
                    <span className="text-xs text-gray-500 font-medium">
                      {format(new Date(helenaClassDataInicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(helenaClassDataFim + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>

              {!pesquisadoClassificacoesHelena ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                    <Clock className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-base font-medium">Nenhum período selecionado</p>
                  <p className="text-sm">Selecione um período e clique em <span className="font-semibold text-red-600">Pesquisar</span></p>
                </div>
              ) : errorClassificacoesHelena ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorClassificacoesHelena}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Classificações Gerais */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="w-5 h-5 text-red-600" />
                      <h2 className="text-base font-bold text-gray-900">Classificações</h2>
                    </div>
                    <p className="text-xs text-gray-400 mb-5">Volume por classificação</p>
                    {!loadingClassificacoesHelena && classificacoesHelena && classificacoesHelena.classificacoes.length > 0 ? (
                      <div className="space-y-3">
                        {classificacoesHelena.classificacoes.slice(0, 20).map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-gray-800 truncate">{item.categoria}</span>
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{item.total.toLocaleString('pt-BR')} ({item.percentual}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${item.percentual}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <AlertCircle className="w-6 h-6" />
                        <p className="text-sm">Nenhuma classificação encontrada no período</p>
                        <p className="text-xs text-gray-400">As conversas finalizadas não possuem classificação preenchida</p>
                      </div>
                    )}
                  </div>

                  {/* Classificações por Agente */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Headphones className="w-5 h-5 text-red-600" />
                      <h2 className="text-base font-bold text-gray-900">Classificações por Agente</h2>
                    </div>
                    <p className="text-xs text-gray-400 mb-5">Quantidade de atendimentos por agente e classificação</p>
                    <div className="h-96">
                      {!loadingClassificacoesHelena && classificacoesHelena && classificacoesHelena.porAgente.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.values(
                              classificacoesHelena.porAgente.reduce<Record<string, { agente: string; total: number }>>((acc, item) => {
                                if (!acc[item.agente]) acc[item.agente] = { agente: item.agente, total: 0 };
                                acc[item.agente].total += item.total;
                                return acc;
                              }, {})
                            ).sort((a, b) => b.total - a.total)}
                            layout="vertical"
                            margin={{ left: 100 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                            <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="agente" type="category" width={120} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(_v: number) => [_v, 'Total de Classificações']} labelFormatter={(label) => `Agente: ${label}`} />
                            <Bar dataKey="total" fill="#dc2626" radius={[0, 4, 4, 0]} name="Total de Classificações" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {!loadingClassificacoesHelena && (!classificacoesHelena || classificacoesHelena.porAgente.length === 0) && (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                          <AlertCircle className="w-6 h-6" />
                          <p className="text-sm">Nenhuma classificação por agente encontrada</p>
                        </div>
                      )}
                    </div>

                    {/* Tabela de Classificações por Agente */}
                    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Agente</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Classificação</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {loadingClassificacoesHelena ? (
                            <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Carregando...</td></tr>
                          ) : classificacoesHelena && classificacoesHelena.porAgente.length > 0 ? (
                            classificacoesHelena.porAgente.slice(0, 50).map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-gray-900">{item.agente}</td>
                                <td className="px-4 py-3 text-gray-600">{item.categoria}</td>
                                <td className="px-4 py-3 text-right font-bold text-gray-900">{item.total.toLocaleString('pt-BR')}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Sem dados para o período</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default App
