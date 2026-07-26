import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
      influencer_ref
    } = body

    // Validações básicas
    if (!nome || !whatsapp || !email || !perfil_principal || !tag_perfil) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Usar variáveis de ambiente do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Configuração do banco de dados incompleta' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
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
          influencer_ref: influencer_ref || null
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro Supabase:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error: unknown) {
    const err = error as Error
    console.error('Erro ao salvar lead:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
