'use client'

import { useEffect, useState } from 'react'
import { Check, Shield, Zap, Lock, X, Users, CheckCircle2 } from 'lucide-react'
import ConfirmacaoPagamento from '@/components/ConfirmacaoPagamento'
import Downsell from '@/components/Downsell'

interface CheckoutFinalProps {
  plano?: 'mensal' | 'anual'
  onCheckout?: () => void
  influencerRef?: string
}

const SOCIAL_PROOFS = [
  { nome: 'Alessandra Santos', profissao: 'biomédica', estado: 'Santa Catarina' },
  { nome: 'Camila Oliveira', profissao: 'esteticista', estado: 'São Paulo' },
  { nome: 'Juliana Martins', profissao: 'biomédica', estado: 'Paraná' },
  { nome: 'Fernanda Rocha', profissao: 'esteticista', estado: 'Minas Gerais' },
  { nome: 'Patrícia Alves', profissao: 'biomédica', estado: 'Rio de Janeiro' },
  { nome: 'Mariana Costa', profissao: 'esteticista', estado: 'Bahia' },
  { nome: 'Renata Lima', profissao: 'biomédica', estado: 'Goiás' },
]

export default function CheckoutFinal({ plano = 'anual', onCheckout, influencerRef = 'clecio' }: CheckoutFinalProps) {
  const [showConfirmacao, setShowConfirmacao] = useState(false)
  const [showDownsell, setShowDownsell] = useState(false)
  const [downsellMostrado, setDownsellMostrado] = useState(false)
  const [popup, setPopup] = useState<{ nome: string; profissao: string; estado: string } | null>(null)
  const [popupIndex, setPopupIndex] = useState(0)

  // Detecção de intenção de saída via mouse (desktop)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !downsellMostrado && !showConfirmacao) {
        setShowDownsell(true)
        setDownsellMostrado(true)
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [downsellMostrado, showConfirmacao])

  // Pop-ups de prova social
  useEffect(() => {
    if (showConfirmacao || showDownsell) return

    // Primeiro popup aparece após 5s
    const initialDelay = setTimeout(() => {
      setPopup(SOCIAL_PROOFS[0])
      setPopupIndex(0)

      // Oculta após 4.5s
      const hide = setTimeout(() => setPopup(null), 4500)

      const startCycle = () => {
        const interval = setInterval(() => {
          if (showConfirmacao || showDownsell) {
            clearInterval(interval)
            return
          }
          setPopupIndex(prev => {
            const next = (prev + 1) % SOCIAL_PROOFS.length
            setPopup(SOCIAL_PROOFS[next])
            setTimeout(() => setPopup(null), 4500)
            return next
          })
        }, 28000 + Math.random() * 12000)
        return interval
      }

      const cycleInterval = startCycle()
      return () => {
        clearTimeout(hide)
        clearInterval(cycleInterval)
      }
    }, 5000)

    return () => clearTimeout(initialDelay)
  }, [showConfirmacao, showDownsell])

  const couponParam = influencerRef && influencerRef !== 'clecio' ? `&coupon=${influencerRef}` : ''
  const CHECKOUT_URLS = {
    anual: `https://app.autoclinicai.com.br/checkout?reseller=clecio&plan=starter&interval=annual${couponParam}`,
    mensal: `https://app.autoclinicai.com.br/checkout?reseller=clecio&plan=starter${couponParam}`,
    downsell: `https://app.autoclinicai.com.br/checkout?reseller=clecio&plan=starter&interval=annual&promo=true${couponParam}`,
  }

  // Renderização condicional após todos os hooks
  if (showConfirmacao) {
    return <ConfirmacaoPagamento onEntrar={() => onCheckout?.()} />
  }

  if (showDownsell) {
    return (
      <Downsell
        onAceitar={() => { window.location.href = CHECKOUT_URLS.downsell }}
        onRecusar={() => onCheckout?.()}
      />
    )
  }

  const isAnual = plano === 'anual'

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-8 px-4 relative">

      {/* ── POP-UP DE PROVA SOCIAL ── */}
      <div
        className={`fixed bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xs z-50 transition-all duration-500 ease-in-out ${
          popup ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {popup && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-4 py-3 flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 leading-snug">
                {popup.nome}, <span className="font-normal text-gray-600">{popup.profissao}</span>
                <span className="text-gray-400"> – {popup.estado}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">acabou de ativar o autoclinic.ai</p>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTÃO FECHAR (X) — fixo no topo esquerdo, leva para downsell ── */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => { setShowDownsell(true); setDownsellMostrado(true) }}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">

        {/* ── BLOCO 1 — HEADER DO PLANO ── */}
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-purple-500 mb-2">
            Plano selecionado
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
            {isAnual ? 'Plano Anual autoclinic.ai' : 'Plano Mensal autoclinic.ai'}
          </h1>
        </div>

        {/* ── BLOCO 2 — CARD DE PREÇO ── */}
        <div className="relative border-2 border-purple-600 rounded-2xl p-6 shadow-lg text-center">

          {isAnual && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-purple-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full whitespace-nowrap">
                Economize R$ 1.200/ano
              </span>
            </div>
          )}

          <div className="pt-2">
            {/* Preço principal */}
            <div className="flex items-baseline justify-center gap-1.5 mb-2">
              <span className="text-6xl font-black text-gray-900">{isAnual ? 'R$ 197' : 'R$ 297'}</span>
              <span className="text-lg text-gray-500 font-medium">/ mês</span>
            </div>

            {/* Cobrança */}
            <p className="text-sm text-gray-500">
              {isAnual
                ? <><span className="font-semibold text-gray-700">Cobrança anual: R$ 2.364</span></>
                : 'Cobrança mensal'
              }
            </p>
          </div>
        </div>

        {/* ── BLOCO 2.5 — CONTADOR DE PRÉ-LANÇAMENTO ── */}
        <div className="flex flex-col items-center gap-1.5 py-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Preço de pré-lançamento para as primeiras 400 clínicas
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 rounded-full px-3 py-1">
              <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="text-xs font-bold text-purple-700">347 já ativaram</span>
              <span className="text-xs text-purple-400 font-medium">de 400</span>
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="w-full max-w-[220px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: '86.75%' }}
            />
          </div>
          <p className="text-[10px] text-gray-400 font-medium">Restam apenas 53 vagas neste preço</p>
        </div>

        {/* ── BLOCO 3 — BOTÃO PRINCIPAL ── */}
        <div className="space-y-2">
          <button
            onClick={() => { window.location.href = isAnual ? CHECKOUT_URLS.anual : CHECKOUT_URLS.mensal }}
            className="w-full py-5 px-6 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-black text-base sm:text-lg rounded-2xl shadow-[0_8px_24px_rgba(126,34,206,0.4)] hover:shadow-[0_12px_32px_rgba(126,34,206,0.5)] transition-all duration-200 uppercase tracking-wide"
          >
            Ativar minha clínica inteligente
          </button>

          {/* Garantia de 7 dias */}
          <p className="text-center text-xs text-gray-400">
            Garantia de 7 dias — se não gostar devolvemos seu dinheiro.
          </p>
        </div>

        {/* ── BLOCO 4 — MICRO-ELEMENTOS DE CONFIANÇA ── */}
        <div className="space-y-2">
          {[
            { icon: Shield, text: 'Pagamento seguro' },
            { icon: Zap, text: 'Acesso imediato após pagamento' },
            { icon: Check, text: 'Cancelamento a qualquer momento' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center justify-center gap-2 text-gray-500">
              <Icon className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs font-medium">{text}</span>
            </div>
          ))}
        </div>

        {/* ── BLOCO 5 — FORMAS DE PAGAMENTO ── */}
        <div className="space-y-3 pb-6">
          <p className="text-center text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
            Formas de pagamento
          </p>
          <div className="flex items-center justify-center gap-3">
            {/* Visa */}
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex items-center justify-center min-w-[56px] h-9">
              <svg viewBox="0 0 60 20" className="h-4 w-auto" aria-label="Visa">
                <text x="0" y="16" fontSize="18" fontWeight="700" fontFamily="Arial" fill="#1A1F71">VISA</text>
              </svg>
            </div>
            {/* Mastercard */}
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex items-center justify-center min-w-[56px] h-9">
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-red-500 opacity-90" />
                <div className="w-5 h-5 rounded-full bg-yellow-400 opacity-90 -ml-2" />
              </div>
            </div>
            {/* Pix */}
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex items-center justify-center min-w-[56px] h-9">
              <svg viewBox="0 0 50 20" className="h-4 w-auto" aria-label="Pix">
                <text x="0" y="15" fontSize="14" fontWeight="700" fontFamily="Arial" fill="#32BCAD">PIX</text>
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-gray-400">
            <Lock className="w-3 h-3" />
            <span className="text-[11px]">Criptografia SSL 256 bits</span>
          </div>
        </div>

      </div>
    </div>
  )
}
