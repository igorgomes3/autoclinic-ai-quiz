import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    // 1. Validar autenticação via token do Supabase
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    // 2. Chamar a API do Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Chave secreta do Stripe não configurada (.env.local)' }, { status: 500 })
    }

    const stripeUrl = new URL('https://api.stripe.com/v1/checkout/sessions')
    stripeUrl.searchParams.set('limit', '100')
    stripeUrl.searchParams.set('status', 'complete')
    // Adicionar expansão de discounts e discounts.promotion_code
    stripeUrl.searchParams.append('expand[]', 'data.discounts')
    stripeUrl.searchParams.append('expand[]', 'data.discounts.promotion_code')

    const stripeRes = await fetch(stripeUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`
      }
    })

    if (!stripeRes.ok) {
      const errorData = await stripeRes.json()
      console.error('Erro na API do Stripe:', errorData)
      return NextResponse.json({ error: 'Erro de comunicação com o Stripe' }, { status: 502 })
    }

    const stripeData = await stripeRes.json()
    const sessions = stripeData.data || []

    // 3. Mapear as sessões extraindo cupons/promo codes e normalizando dados
    const sales = sessions.map((session: any) => {
      let coupon = null
      
      if (session.discounts && session.discounts.length > 0) {
        const disc = session.discounts[0]
        if (disc.promotion_code) {
          coupon = disc.promotion_code.code
        } else if (disc.coupon) {
          coupon = disc.coupon.id
        }
      }

      return {
        id: session.id,
        email: session.customer_details?.email || null,
        name: session.customer_details?.name || null,
        amount_total: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        coupon: coupon ? coupon.toLowerCase() : null,
        created_at: new Date(session.created * 1000).toISOString()
      }
    })

    return NextResponse.json({ success: true, sales })

  } catch (error: any) {
    console.error('Erro na API stripe-stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
