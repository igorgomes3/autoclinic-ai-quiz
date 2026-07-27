'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lead = {
  id: string
  nome: string
  email: string
  whatsapp: string
  perfil_principal: string
  perfil_secundario: string | null
  score_sobrecarga: number
  score_gestao: number
  score_conversao: number
  score_financeiro: number
  tag_perfil: string | null
  checkout_clicado: boolean
  status_compra: string
  data_conclusao_quiz: string
  created_at: string
  data_clique_checkout: string | null
  plano_comprado: string | null
  kiwify_order_id: string | null
  data_compra: string | null
  influencer_ref: string | null
}

type InfluencerStats = {
  ref: string
  total_leads: number
  checkout_clicado: number
  compradores: number
  conversao_pct: number
  faturamento: number
}

type Tab = 'overview' | 'leads' | 'influencers'

const PERFIL_LABEL: Record<string, string> = {
  sobrecarga: '🔥 Sobrecarga',
  gestao: '📊 Gestão',
  conversao: '💰 Conversão',
  financeiro: '📈 Financeiro',
}

const STATUS_COLORS: Record<string, string> = {
  'Comprou': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Não_Comprou': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  'Reembolsado': 'bg-red-500/15 text-red-400 border-red-500/30',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-black ${color ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [leads, setLeads] = useState<Lead[]>([])
  const [stripeSales, setStripeSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stripeLoading, setStripeLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterInfluencer, setFilterInfluencer] = useState('todos')
  const [sortBy, setSortBy] = useState<'created_at' | 'nome' | 'status_compra'>('created_at')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [userEmail, setUserEmail] = useState('')

  const loadStripeSales = useCallback(async (token: string) => {
    setStripeLoading(true)
    try {
      const response = await fetch('/api/admin/stripe-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await response.json()
      if (result.success) {
        setStripeSales(result.sales || [])
      } else {
        console.error('Erro ao buscar vendas do Stripe:', result.error)
      }
    } catch (err) {
      console.error('Erro de conexão com o Stripe:', err)
    } finally {
      setStripeLoading(false)
    }
  }, [])

  const loadLeads = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('leads').select('*').order(sortBy, { ascending: sortDir === 'asc' })
    const { data } = await query
    setLeads(data ?? [])
    setLoading(false)
  }, [sortBy, sortDir])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    setStripeLoading(true)
    
    // 1. Carregar leads
    let query = supabase.from('leads').select('*').order(sortBy, { ascending: sortDir === 'asc' })
    const { data } = await query
    setLeads(data ?? [])
    setLoading(false)

    // 2. Carregar Stripe
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await loadStripeSales(session.access_token)
    } else {
      setStripeLoading(false)
    }
  }, [sortBy, sortDir, loadStripeSales])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/admin')
      } else {
        setUserEmail(data.session.user.email ?? '')
        handleRefresh()
      }
    })
  }, [router, handleRefresh])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin')
  }

  // Cruzar os dados dos leads com as vendas reais do Stripe por email
  const processedLeads = leads.map(l => {
    const hasBought = stripeSales.some(sale => sale.email && sale.email.toLowerCase() === l.email.toLowerCase())
    return {
      ...l,
      status_compra: hasBought ? 'Comprou' : l.status_compra
    }
  })

  // Derived data
  const filteredLeads = processedLeads.filter(l => {
    const matchSearch = search === '' ||
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.whatsapp.includes(search) ||
      (l.influencer_ref ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todos' || l.status_compra === filterStatus
    const matchInfluencer = filterInfluencer === 'todos' || (l.influencer_ref ?? 'clecio') === filterInfluencer
    return matchSearch && matchStatus && matchInfluencer
  })

  const uniqueInfluencers = [...new Set(processedLeads.map(l => l.influencer_ref ?? 'clecio'))]

  const influencerStats: InfluencerStats[] = uniqueInfluencers.map(ref => {
    const group = processedLeads.filter(l => (l.influencer_ref ?? 'clecio') === ref)
    const checkoutClicado = group.filter(l => l.checkout_clicado).length

    // Filtrar vendas do Stripe associadas a este influencer (por cupom)
    const refSales = stripeSales.filter(sale => {
      if (ref === 'clecio') {
        return !sale.coupon || sale.coupon === 'clecio'
      }
      return sale.coupon === ref.toLowerCase()
    })

    const compradores = refSales.length
    const faturamento = refSales.reduce((acc, sale) => acc + sale.amount_total, 0)

    return {
      ref,
      total_leads: group.length,
      checkout_clicado: checkoutClicado,
      compradores,
      conversao_pct: group.length > 0 ? Math.round((compradores / group.length) * 100) : 0,
      faturamento
    }
  }).sort((a, b) => b.total_leads - a.total_leads)

  // Overview stats
  const totalLeads = processedLeads.length
  const totalCompradores = stripeSales.length // total sales from Stripe
  const totalCheckout = processedLeads.filter(l => l.checkout_clicado).length
  const totalFaturamento = stripeSales.reduce((acc, sale) => acc + sale.amount_total, 0)
  const conversionPct = totalLeads > 0 ? ((totalCompradores / totalLeads) * 100).toFixed(1) : '0'

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Visão Geral', icon: '📊' },
    { key: 'leads', label: 'Leads', icon: '👥' },
    { key: 'influencers', label: 'Influencers', icon: '🤝' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-60 bg-slate-900/80 backdrop-blur border-r border-white/5 flex flex-col z-20">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-lg font-black tracking-tight">
            autoclinic<span className="text-purple-400">.ai</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{userEmail}</p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-slate-500 hover:text-red-400 transition-colors py-2 hover:bg-red-500/5 rounded-lg"
          >
            Sair da conta →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">
              {tab === 'overview' ? 'Visão Geral' : tab === 'leads' ? 'Gerenciar Leads' : 'Influencers & Afiliados'}
            </h2>
            <p className="text-slate-500 text-xs">{totalLeads} leads no total</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || stripeLoading}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 transition-all"
          >
            <svg className={`w-3.5 h-3.5 ${loading || stripeLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Atualizar
          </button>
        </header>

        <div className="p-8">

          {/* ─── OVERVIEW ─── */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total de Leads" value={totalLeads} sub="todos os tempos" />
                <StatCard label="Vendas (Stripe)" value={totalCompradores} sub="pagamento confirmado" color="text-emerald-400" />
                <StatCard label="Faturamento Total" value={`R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} sub="bruto no Stripe" color="text-purple-400" />
                <StatCard label="Conversão" value={`${conversionPct}%`} sub="leads → vendas" color={parseFloat(conversionPct) > 5 ? 'text-emerald-400' : 'text-amber-400'} />
              </div>

              {/* Perfis breakdown */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Distribuição de Perfis</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['sobrecarga', 'gestao', 'conversao', 'financeiro'] as const).map(p => {
                    const count = leads.filter(l => l.perfil_principal === p).length
                    const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
                    return (
                      <div key={p} className="flex items-center justify-between bg-white/3 rounded-xl px-4 py-3">
                        <span className="text-sm text-slate-300">{PERFIL_LABEL[p]}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top influencers */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Top Influencers por Faturamento</h3>
                <div className="space-y-2">
                  {influencerStats
                    .filter(i => i.faturamento > 0 || i.total_leads > 0)
                    .slice(0, 5)
                    .map(i => (
                      <div key={i.ref} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400">
                            {i.ref.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-white font-medium">?ref={i.ref}</span>
                        </div>
                        <div className="flex items-center gap-6 text-xs text-slate-400">
                          <span><span className="text-white font-bold">{i.total_leads}</span> leads</span>
                          <span><span className="text-purple-400 font-bold">{i.checkout_clicado}</span> checkout</span>
                          <span><span className="text-emerald-400 font-bold">{i.compradores}</span> vendas</span>
                          <span><span className="text-purple-300 font-bold">R$ {i.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
                          <span className={`font-bold ${i.conversao_pct >= 5 ? 'text-emerald-400' : 'text-slate-400'}`}>{i.conversao_pct}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── LEADS ─── */}
          {tab === 'leads' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Buscar por nome, email, WhatsApp..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                >
                  <option value="todos">Todos os status</option>
                  <option value="Não_Comprou">Não Comprou</option>
                  <option value="Comprou">Comprou</option>
                  <option value="Reembolsado">Reembolsado</option>
                </select>
                <select
                  value={filterInfluencer}
                  onChange={e => setFilterInfluencer(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                >
                  <option value="todos">Todos os influencers</option>
                  {uniqueInfluencers.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={`${sortBy}_${sortDir}`}
                  onChange={e => {
                    const [s, d] = e.target.value.split('_') as [typeof sortBy, typeof sortDir]
                    setSortBy(s); setSortDir(d)
                  }}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="created_at_desc">Mais recentes</option>
                  <option value="created_at_asc">Mais antigos</option>
                  <option value="nome_asc">Nome A-Z</option>
                  <option value="status_compra_asc">Status</option>
                </select>
                <span className="text-slate-500 text-xs">{filteredLeads.length} resultados</span>
              </div>

              {/* Table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Nome</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Contato</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Perfil</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Influencer</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Checkout</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-16 text-slate-500">
                            <svg className="animate-spin w-6 h-6 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Carregando leads...
                          </td>
                        </tr>
                      ) : filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-16 text-slate-500">Nenhum lead encontrado</td>
                        </tr>
                      ) : filteredLeads.map(lead => (
                        <tr key={lead.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-white">{lead.nome}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-slate-300">{lead.email}</p>
                            <p className="text-slate-500 text-xs">{lead.whatsapp}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full px-2.5 py-1">
                              {PERFIL_LABEL[lead.perfil_principal] ?? lead.perfil_principal}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-mono text-slate-400">
                              {lead.influencer_ref ?? 'clecio'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs border rounded-full px-2.5 py-1 ${STATUS_COLORS[lead.status_compra] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
                              {lead.status_compra.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {lead.checkout_clicado ? (
                              <span className="text-emerald-400 text-xs">✓ Sim</span>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                            {formatDate(lead.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── INFLUENCERS ─── */}
          {tab === 'influencers' && (
            <div className="space-y-6">
              {/* Instructions box */}
              <div className="bg-purple-600/10 border border-purple-500/20 rounded-2xl p-5">
                <h3 className="text-purple-300 font-bold text-sm mb-2">🔗 Como gerar links para influencers</h3>
                <p className="text-slate-400 text-sm">
                  Basta adicionar <code className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono text-xs">?ref=NOME</code> no link do quiz.
                  O nome do influencer será rastreado no banco e repassado automaticamente para o checkout.
                </p>
                <div className="mt-3 bg-slate-900/50 rounded-xl px-4 py-3 font-mono text-xs text-slate-300 break-all">
                  https://quiz.autoclinicai.com.br/?ref=joaomarketing
                </div>
              </div>

              {/* Influencers table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{influencerStats.length} influencer(s) ativos</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Ref</th>
                      <th className="text-left px-6 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Leads</th>
                      <th className="text-left px-6 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Clicaram Checkout</th>
                      <th className="text-left px-6 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Compradores (Stripe)</th>
                      <th className="text-left px-6 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Faturamento</th>
                      <th className="text-left px-6 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Conversão Real</th>
                      <th className="text-left px-6 py-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Link do Quiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {influencerStats.map((inf, idx) => (
                      <tr key={inf.ref} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400">
                              {idx + 1}
                            </div>
                            <span className="font-mono font-bold text-white">{inf.ref}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-white">{inf.total_leads}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-purple-400 font-bold">{inf.checkout_clicado}</span>
                          <span className="text-slate-600 text-xs ml-1">
                            ({inf.total_leads > 0 ? Math.round(inf.checkout_clicado / inf.total_leads * 100) : 0}%)
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-emerald-400 font-bold">{inf.compradores}</span>
                        </td>
                        <td className="px-6 py-4 text-purple-300 font-bold">
                          R$ {inf.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${inf.conversao_pct >= 5 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(inf.conversao_pct * 5, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${inf.conversao_pct >= 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {inf.conversao_pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              const url = `https://quiz.autoclinicai.com.br/?ref=${inf.ref}`
                              navigator.clipboard.writeText(url)
                            }}
                            className="text-xs text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1.5 font-mono"
                          >
                            <span>?ref={inf.ref}</span>
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
