import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

/**
 * Grava o lead do quiz.
 *
 * O que mudou e por quê: quando o projeto Supabase do quiz ficou pausado, esta
 * rota passou a devolver `500 {"error":"error code: 1016"}` — erro de DNS do
 * host do banco — e o front engolia no console. O lead respondia dez perguntas,
 * entregava nome, email e WhatsApp, e o registro se perdia sem ninguém saber.
 *
 * Daqui para frente:
 *   - banco indisponível é `502` com código legível, para o front poder mostrar
 *     "tentar de novo" em vez de seguir como se tivesse salvo;
 *   - a chamada ao banco tem teto de tempo (12s), senão a rota fica pendurada;
 *   - a ponte com o painel do Clécio é melhor-esforço: se ela cair, o lead já
 *     está salvo e a resposta diz `ponte: "falhou"` — não se perde o cadastro
 *     por causa do segundo destino.
 */
const TIMEOUT_BANCO_MS = 12_000
const TIMEOUT_PONTE_MS = 6_000

type Corpo = {
  nome?: string
  whatsapp?: string
  email?: string
  perfil_principal?: string
  perfil_secundario?: string | null
  score_sobrecarga?: number
  score_gestao?: number
  score_conversao?: number
  score_financeiro?: number
  tag_perfil?: string
  checkout_clicado?: boolean
  status_compra?: string
  data_conclusao_quiz?: string
  influencer_ref?: string | null
}

type LeadGravado = Record<string, unknown> & { id?: string }

function recusar(status: number, erro: string, codigo: string) {
  return NextResponse.json({ error: erro, codigo }, { status })
}

/** Manda o lead para o painel do Clécio. Nunca derruba a resposta do quiz. */
async function avisarPainel(lead: LeadGravado): Promise<'ok' | 'falhou' | 'desligada'> {
  const base = process.env.PAINEL_QUIZ_URL
  const token = process.env.PAINEL_QUIZ_TOKEN
  if (!base || !token) return 'desligada'

  try {
    const resposta = await fetch(`${base.replace(/\/$/, '')}/api/publico/quiz/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-quiz-token': token },
      body: JSON.stringify({
        quiz_lead_id: lead.id,
        nome: lead.nome,
        whatsapp: lead.whatsapp,
        email: lead.email,
        perfil_principal: lead.perfil_principal,
        perfil_secundario: lead.perfil_secundario,
        score_sobrecarga: lead.score_sobrecarga,
        score_gestao: lead.score_gestao,
        score_conversao: lead.score_conversao,
        score_financeiro: lead.score_financeiro,
        concluido_em: lead.data_conclusao_quiz,
      }),
      signal: AbortSignal.timeout(TIMEOUT_PONTE_MS),
    })
    if (!resposta.ok) {
      console.error('ponte do quiz: painel respondeu', resposta.status, (await resposta.text()).slice(0, 200))
      return 'falhou'
    }
    return 'ok'
  } catch (erro) {
    console.error('ponte do quiz: erro de rede', (erro as Error).message)
    return 'falhou'
  }
}

export async function POST(request: NextRequest) {
  let body: Corpo
  try {
    body = (await request.json()) as Corpo
  } catch {
    return recusar(400, 'Corpo da requisição não é JSON válido', 'JSON_INVALIDO')
  }

  const {
    nome,
    whatsapp,
    email,
    perfil_principal,
    perfil_secundario,
    score_sobrecarga,
    score_gestao,
    score_conversao,
    score_financeiro,
    tag_perfil,
    checkout_clicado,
    status_compra,
    data_conclusao_quiz,
    influencer_ref,
  } = body

  // Validações básicas
  if (!nome || !whatsapp || !email || !perfil_principal || !tag_perfil) {
    return recusar(400, 'Campos obrigatórios faltando', 'CAMPOS_FALTANDO')
  }

  // Usar variáveis de ambiente do Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('quiz: configuração do banco ausente (URL ou chave)')
    return recusar(500, 'Não foi possível salvar seus dados agora', 'BANCO_NAO_CONFIGURADO')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const gravacao = supabase
    .from('leads')
    .insert([
      {
        nome,
        whatsapp,
        email,
        perfil_principal,
        perfil_secundario: perfil_secundario || null,
        score_sobrecarga: score_sobrecarga || 0,
        score_gestao: score_gestao || 0,
        score_conversao: score_conversao || 0,
        score_financeiro: score_financeiro || 0,
        tag_perfil,
        checkout_clicado: checkout_clicado || false,
        status_compra: status_compra || 'Não_Comprou',
        data_conclusao_quiz: data_conclusao_quiz || new Date().toISOString(),
        influencer_ref: influencer_ref || null,
      },
    ])
    .select()
    .single()

  let data: LeadGravado | null = null
  let erro: unknown = null
  try {
    // Teto de tempo: sem isso, banco fora do ar deixa a rota pendurada e o
    // visitante olhando para um botão que não termina.
    const resultado = (await Promise.race([
      gravacao,
      new Promise<never>((_, rejeitar) =>
        setTimeout(
          () => rejeitar(new Error(`banco não respondeu em ${TIMEOUT_BANCO_MS}ms`)),
          TIMEOUT_BANCO_MS,
        ),
      ),
    ])) as { data: LeadGravado | null; error: unknown }
    data = resultado.data
    erro = resultado.error
  } catch (e) {
    erro = e
  }

  if (erro || !data) {
    const detalhe = erro instanceof Error ? erro.message : JSON.stringify(erro)
    // Servidor registra a causa crua; o visitante recebe o que dá para agir.
    console.error('quiz: falha ao gravar lead', detalhe)
    return recusar(502, 'Não foi possível salvar seus dados agora', 'BANCO_INDISPONIVEL')
  }

  const ponte = await avisarPainel(data)

  return NextResponse.json({ success: true, data, ponte })
}
