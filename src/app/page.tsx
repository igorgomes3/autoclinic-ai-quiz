'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { createClient } from '@supabase/supabase-js'
import DiagnosticoComparacao from '@/components/DiagnosticoComparacao'
import ProjecaoResultados from '@/components/ProjecaoResultados'
import ProjecaoClinica from '@/components/ProjecaoClinica'
import CheckoutFinal from '@/components/CheckoutFinal'
import TelaEscolhaPlanos from '@/components/TelaEscolhaPlanos'
import TelaOfertaPrincipal from '@/components/TelaOfertaPrincipal'
import Downsell from '@/components/Downsell'
import ConfirmacaoPagamento from '@/components/ConfirmacaoPagamento'

// Cliente Supabase - configurado para usar o projeto VISUALIZA.AI AVI
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Sistema de pontuação por 4 eixos:
// SOBRECARGA = Operacional Sobrecarregada
// GESTÃO = Estrutura Fragmentada
// CONVERSÃO = Experiência Limitada
// FINANCEIRO = Crescimento Imprevisível

type ScoreMap = {
  sobrecarga: number
  gestao: number
  conversao: number
  financeiro: number
}

const quizQuestions = [
  {
    id: 1,
    question: "Hoje, sua clínica funciona de forma estratégica ou você ainda sente que está no modo operacional o tempo todo?",
    options: [
      { text: "Estou constantemente apagando incêndios e resolvendo tudo sozinha", score: { sobrecarga: 2, gestao: 0, conversao: 0, financeiro: 0 } },
      { text: "Trabalho o dia inteiro, mas sinto que poderia produzir muito mais com organização", score: { sobrecarga: 1.5, gestao: 0, conversao: 0, financeiro: 0 } },
      { text: "Minha agenda é cheia, mas me sinto sobrecarregada", score: { sobrecarga: 1, gestao: 0, conversao: 0, financeiro: 0 } },
      { text: "Minha rotina é organizada e consigo manter controle estratégico", score: { sobrecarga: 0.5, gestao: 0, conversao: 0, financeiro: 0 } }
    ]
  },
  {
    id: 2,
    question: "Em relação ao faturamento da sua clínica, qual cenário mais representa sua realidade atual?",
    options: [
      { text: "Atendo bastante, mas meu lucro não acompanha meu esforço", score: { sobrecarga: 0, gestao: 0, conversao: 0, financeiro: 4 } },
      { text: "Meu faturamento oscila e isso gera insegurança", score: { sobrecarga: 0, gestao: 0, conversao: 0, financeiro: 3 } },
      { text: "Sei que existe potencial de crescimento, mas falta previsibilidade", score: { sobrecarga: 0, gestao: 0, conversao: 0, financeiro: 2 } },
      { text: "Tenho controle financeiro e previsibilidade estruturada", score: { sobrecarga: 0, gestao: 0, conversao: 0, financeiro: 1 } }
    ]
  },
  {
    id: 3,
    question: "Você sente que precisa trabalhar cada vez mais para manter ou aumentar seu faturamento?",
    options: [
      { text: "Sim, para ganhar mais eu preciso trabalhar mais", score: { sobrecarga: 2, gestao: 0, conversao: 0, financeiro: 0 } },
      { text: "Muitas vezes sinto que o esforço não é proporcional ao retorno", score: { sobrecarga: 1.5, gestao: 0, conversao: 0, financeiro: 0 } },
      { text: "Já percebi que estou no limite da minha capacidade atual", score: { sobrecarga: 1, gestao: 0, conversao: 0, financeiro: 0 } },
      { text: "Não, consigo crescer sem aumentar minha carga de trabalho", score: { sobrecarga: 0.5, gestao: 0, conversao: 0, financeiro: 0 } }
    ]
  },
  {
    id: 4,
    question: "Quanto tempo do seu dia é consumido respondendo as mesmas dúvidas de pacientes?",
    options: [
      { text: "Respondo repetidamente as mesmas perguntas todos os dias", score: { sobrecarga: 0, gestao: 0, conversao: 4, financeiro: 0 } },
      { text: "Isso acontece com frequência e me toma tempo", score: { sobrecarga: 0, gestao: 0, conversao: 3, financeiro: 0 } },
      { text: "Acontece às vezes, mas ainda é manual", score: { sobrecarga: 0, gestao: 0, conversao: 2, financeiro: 0 } },
      { text: "Tenho respostas estruturadas ou automatizadas", score: { sobrecarga: 0, gestao: 0, conversao: 1, financeiro: 0 } }
    ]
  },
  {
    id: 5,
    question: "Como você gerencia agenda, histórico de pacientes e evolução dos procedimentos?",
    options: [
      { text: "Uso ferramentas separadas ou anotações manuais", score: { sobrecarga: 0, gestao: 4, conversao: 0, financeiro: 0 } },
      { text: "Tenho sistema, mas não é integrado", score: { sobrecarga: 0, gestao: 3, conversao: 0, financeiro: 0 } },
      { text: "Consigo me organizar, mas não tenho visão estratégica", score: { sobrecarga: 0, gestao: 2, conversao: 0, financeiro: 0 } },
      { text: "Uso sistema integrado e tenho controle total", score: { sobrecarga: 0, gestao: 1, conversao: 0, financeiro: 0 } }
    ]
  },
  {
    id: 6,
    question: "Você possui controle claro sobre estoque e custos dos seus procedimentos?",
    options: [
      { text: "Não tenho controle real", score: { sobrecarga: 0, gestao: 2, conversao: 0, financeiro: 2 } },
      { text: "Tenho noção aproximada", score: { sobrecarga: 0, gestao: 1.5, conversao: 0, financeiro: 1.5 } },
      { text: "Registro, mas não analiso estrategicamente", score: { sobrecarga: 0, gestao: 1, conversao: 0, financeiro: 1 } },
      { text: "Tenho controle detalhado e previsível", score: { sobrecarga: 0, gestao: 0.5, conversao: 0, financeiro: 0.5 } }
    ]
  },
  {
    id: 7,
    question: "Sua clínica oferece alguma experiência visual diferenciada antes do procedimento?",
    options: [
      { text: "Não ofereço visualização prévia", score: { sobrecarga: 0, gestao: 0, conversao: 4, financeiro: 0 } },
      { text: "Explico verbalmente, mas sem apoio visual", score: { sobrecarga: 0, gestao: 0, conversao: 3, financeiro: 0 } },
      { text: "Mostro fotos genéricas de antes/depois", score: { sobrecarga: 0, gestao: 0, conversao: 2, financeiro: 0 } },
      { text: "Utilizo simulação personalizada", score: { sobrecarga: 0, gestao: 0, conversao: 1, financeiro: 0 } }
    ]
  },
  {
    id: 8,
    question: "Seu crescimento hoje depende principalmente de você trabalhar mais?",
    options: [
      { text: "Totalmente", score: { sobrecarga: 3, gestao: 0, conversao: 0, financeiro: 0 } },
      { text: "Em grande parte", score: { sobrecarga: 2.5, gestao: 0, conversao: 0, financeiro: 0 } },
      { text: "Parcialmente", score: { sobrecarga: 2, gestao: 0, conversao: 0, financeiro: 0 } },
      { text: "Não, minha estrutura sustenta crescimento", score: { sobrecarga: 1, gestao: 0, conversao: 0, financeiro: 0 } }
    ]
  },
  {
    id: 9,
    question: "Você acompanha indicadores estratégicos da sua clínica mensalmente?",
    options: [
      { text: "Não acompanho indicadores", score: { sobrecarga: 0, gestao: 2, conversao: 0, financeiro: 2 } },
      { text: "Vejo apenas faturamento bruto", score: { sobrecarga: 0, gestao: 1.5, conversao: 0, financeiro: 1.5 } },
      { text: "Acompanho parcialmente", score: { sobrecarga: 0, gestao: 1, conversao: 0, financeiro: 1 } },
      { text: "Tenho painel claro de métricas", score: { sobrecarga: 0, gestao: 0.5, conversao: 0, financeiro: 0.5 } }
    ]
  },
  {
    id: 10,
    question: "Hoje sua clínica está pronta para escalar de forma estruturada?",
    options: [
      { text: "Não, estou no limite operacional", score: { sobrecarga: 2, gestao: 0.5, conversao: 0.5, financeiro: 1 } },
      { text: "Ainda falta organização", score: { sobrecarga: 0.5, gestao: 2, conversao: 0.5, financeiro: 1 } },
      { text: "Tenho base, mas falta tecnologia", score: { sobrecarga: 0.5, gestao: 0.5, conversao: 2, financeiro: 1 } },
      { text: "Sim, tenho estrutura inteligente", score: { sobrecarga: 0.5, gestao: 0.5, conversao: 0.5, financeiro: 0.5 } }
    ]
  }
]

const profiles = {
  sobrecarga: {
    emoji: "🔥",
    title: "A Empreendedora Sobrecarregada",
    descricao: "Você centraliza demais. Trabalha muito, mas cresce pouco. Seu dia é feito de apagar incêndios, responder mensagens, resolver problemas que poderiam ser evitados. Você não tem tempo para pensar estrategicamente porque está sempre no operacional.",
    sintomas: [
      "Você responde tudo manualmente",
      "Seu tempo é consumido por tarefas repetitivas",
      "Crescer significa trabalhar ainda mais"
    ],
    risco: "Se você continuar nesse ritmo, vai chegar ao limite físico e mental antes de alcançar o potencial financeiro da sua clínica.",
    potencial: "Mas o problema não é falta de capacidade. É falta de estrutura. Você tem tudo para escalar — só precisa parar de ser o gargalo do próprio negócio.",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    influencia_secundaria: {
      conversao: "A sobrecarga está impedindo você de criar experiências que convertem melhor.",
      gestao: "Sem organização, a sobrecarga só aumenta. Você está presa em um ciclo.",
      financeiro: "Você trabalha muito, mas o retorno financeiro não acompanha o esforço."
    }
  },
  conversao: {
    emoji: "💎",
    title: "A Especialista que Não Converte",
    descricao: "Você é boa no que faz. Mas suas pacientes não enxergam isso antes de fechar. Falta experiência visual, falta autoridade clara, falta diferenciação. Você vende como todo mundo vende — e por isso perde fechamentos.",
    sintomas: [
      "Você recebe orçamento, mas não fecha",
      "Suas pacientes pedem desconto",
      "Você compete por preço, não por valor"
    ],
    risco: "Se você não se posiciona de forma diferente, vai continuar competindo com clínicas que cobram menos — e perdendo margem.",
    potencial: "Você já tem a técnica. Agora precisa de estratégia de conversão. Quando suas pacientes visualizarem o resultado antes de pagar, a objeção desaparece.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    influencia_secundaria: {
      sobrecarga: "Você trabalha muito tentando compensar com volume o que deveria resolver com conversão.",
      gestao: "Sem controle claro de métricas, você não sabe onde está perdendo pacientes no funil.",
      financeiro: "Converter mal significa faturar menos — mesmo atendendo muito."
    }
  },
  gestao: {
    emoji: "📊",
    title: "A Gestora Fragmentada",
    descricao: "Você tem ferramentas soltas, planilhas desorganizadas, processos que dependem da sua memória. Não há clareza. Você toma decisões no improviso porque não tem dados estruturados para se basear.",
    sintomas: [
      "Você não sabe exatamente quanto lucra por procedimento",
      "Seu controle de estoque é manual ou inexistente",
      "Falta previsibilidade no seu mês"
    ],
    risco: "Sem organização, você nunca vai conseguir delegar, contratar ou escalar. Vai continuar sendo refém do caos.",
    potencial: "Você já sabe que organização importa. Agora precisa de um sistema que centralize tudo e te dê clareza estratégica em tempo real.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    influencia_secundaria: {
      sobrecarga: "A desorganização multiplica a sobrecarga. Você refaz o que já fez porque não tem registro claro.",
      conversao: "Sem dados, você não sabe o que funciona na sua conversão — e continua perdendo pacientes.",
      financeiro: "Gestão fragmentada gera faturamento instável. Você não consegue prever nem controlar."
    }
  },
  financeiro: {
    emoji: "💰",
    title: "A Empreendedora Financeiramente Instável",
    descricao: "Você fatura, mas não sabe exatamente quanto sobra. Um mês é bom, outro é ruim — sem padrão claro. Falta controle de custo, falta margem previsível, falta estrutura financeira.",
    sintomas: [
      "Você não sabe sua margem real por procedimento",
      "Falta previsibilidade de receita",
      "Decisões financeiras são feitas 'no feeling'"
    ],
    risco: "Sem controle financeiro, você pode estar trabalhando muito e lucrando pouco. E nem percebe.",
    potencial: "Você tem capacidade de faturar bem mais — mas precisa de clareza nos números para tomar decisões estratégicas, não emocionais.",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    influencia_secundaria: {
      sobrecarga: "Você trabalha demais achando que vai resolver financeiramente — mas o problema é estrutural, não operacional.",
      conversao: "Sem saber sua margem, você pode estar convertendo pacientes que não te trazem lucro real.",
      gestao: "Desorganização financeira é sintoma de gestão fragmentada. Um alimenta o outro."
    }
  }
}

type ProfileType = 'sobrecarga' | 'gestao' | 'conversao' | 'financeiro'

function QuizContent() {
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [showComparativa, setShowComparativa] = useState(false)
  const [showFeedbackP3, setShowFeedbackP3] = useState(false)
  const [showFeedbackP6, setShowFeedbackP6] = useState(false)
  const [showProjecaoClinica, setShowProjecaoClinica] = useState(false)
  const [showCheckoutFinal, setShowCheckoutFinal] = useState(false)
  const [showEscolhaPlanos, setShowEscolhaPlanos] = useState(false)
  const [showOfertaPrincipal, setShowOfertaPrincipal] = useState(false)
  const [showDownsellFromOffer, setShowDownsellFromOffer] = useState(false)
  const [showConfirmacaoFromOffer, setShowConfirmacaoFromOffer] = useState(false)
  const [planoSelecionado, setPlanoSelecionado] = useState<'mensal' | 'anual'>('anual')
  const [showDiagnosticoComparacao, setShowDiagnosticoComparacao] = useState(false)
  const [showProjecaoResultados, setShowProjecaoResultados] = useState(false)
  const [showTransitionScreen, setShowTransitionScreen] = useState(false)
  const [eixoParcialDominante, setEixoParcialDominante] = useState<ProfileType | null>(null)
  const [perfilPrincipal, setPerfilPrincipal] = useState<ProfileType | null>(null)
  const [perfilSecundario, setPerfilSecundario] = useState<ProfileType | null>(null)
  const [finalScores, setFinalScores] = useState<ScoreMap>({ sobrecarga: 0, gestao: 0, conversao: 0, financeiro: 0 })

  // Estado da tela de pré-diagnóstico (nova tela entre Q10 e captura de dados)
  const [showPreDiagnostico, setShowPreDiagnostico] = useState(false)

  // Estado da tela de preparação para diagnóstico (entre prova social e captura de dados)
  const [showPreparacaoDiagnostico, setShowPreparacaoDiagnostico] = useState(false)

  // Estado da tela de prova social (entre pré-diagnóstico e captura de dados)
  const [showProvaSocial, setShowProvaSocial] = useState(false)
  const [provaSocialIndex, setProvaSocialIndex] = useState(0)
  const [provaSocialTouchStart, setProvaSocialTouchStart] = useState<number | null>(null)
  const [provaSocialPaused, setProvaSocialPaused] = useState(false)
  const provaSocialPausedRef = useRef(false)
  const provaSocialIndexRef = useRef(0)
  const PROVA_SOCIAL_TOTAL = 6

  const searchParams = useSearchParams()

  // Modo debug: /quiz?debug=sobrecarga|gestao|conversao|financeiro
  const debugPerfil = searchParams.get('debug') as ProfileType | null
  const isDebugMode = !!debugPerfil && ['sobrecarga', 'gestao', 'conversao', 'financeiro'].includes(debugPerfil)

  // Rastreamento de afiliado/influencer via ?ref=
  const influencerRef = searchParams.get('ref') || 'clecio'

  // Sync refs com estados
  provaSocialPausedRef.current = provaSocialPaused
  provaSocialIndexRef.current = provaSocialIndex

  // Auto-scroll do carrossel de prova social
  useEffect(() => {
    if (!showProvaSocial) return
    const interval = setInterval(() => {
      if (provaSocialPausedRef.current) return
      setProvaSocialIndex(prev => (prev + 1) % PROVA_SOCIAL_TOTAL)
    }, 3500)
    return () => clearInterval(interval)
  }, [showProvaSocial])

  // Estados das telas de captura
  const [showCaptureNome, setShowCaptureNome] = useState(false)
  const [showCaptureEmail, setShowCaptureEmail] = useState(false)
  const [showCaptureWhatsApp, setShowCaptureWhatsApp] = useState(false)

  // Dados capturados
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [leadId, setLeadId] = useState<string | null>(null)

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100
  const isLastQuestion = currentQuestion === quizQuestions.length - 1

  const handleCheckoutClick = async () => {
    if (leadId) {
      try {
        const response = await fetch('/api/update-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId })
        })
        const result = await response.json()
        if (!response.ok || result.error) {
          console.error('Erro ao registrar clique no checkout:', result.error)
        } else {
          console.log('✅ Clique no checkout registrado!')
        }
      } catch (err) {
        console.error('Erro ao atualizar lead:', err)
      }
    }
    setShowOfertaPrincipal(true)
  }

  const calculatePartialProfile = (allAnswers: Record<number, number>) => {
    const scores: ScoreMap = { sobrecarga: 0, gestao: 0, conversao: 0, financeiro: 0 }

    // Somar pontos apenas das respostas até agora
    Object.entries(allAnswers).forEach(([questionIndex, optionIndex]) => {
      const question = quizQuestions[parseInt(questionIndex)]
      const option = question.options[optionIndex]
      scores.sobrecarga += option.score.sobrecarga
      scores.gestao += option.score.gestao
      scores.conversao += option.score.conversao
      scores.financeiro += option.score.financeiro
    })

    // Encontrar o maior score
    const maxScore = Math.max(scores.sobrecarga, scores.gestao, scores.conversao, scores.financeiro)

    // Regra de desempate: sobrecarga > financeiro > gestao > conversao
    if (scores.sobrecarga === maxScore) return 'sobrecarga'
    if (scores.financeiro === maxScore) return 'financeiro'
    if (scores.gestao === maxScore) return 'gestao'
    return 'conversao'
  }

  const calculateProfile = (allAnswers: Record<number, number>) => {
    const scores: ScoreMap = { sobrecarga: 0, gestao: 0, conversao: 0, financeiro: 0 }

    // Somar pontos de cada resposta
    Object.entries(allAnswers).forEach(([questionIndex, optionIndex]) => {
      const question = quizQuestions[parseInt(questionIndex)]
      const option = question.options[optionIndex]
      scores.sobrecarga += option.score.sobrecarga
      scores.gestao += option.score.gestao
      scores.conversao += option.score.conversao
      scores.financeiro += option.score.financeiro
    })

    // Salvar scores para exibição
    setFinalScores(scores)

    // Ordenar os scores do maior para o menor
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([key]) => key as ProfileType)

    // Perfil principal = maior score
    // Perfil secundário = segundo maior score
    return {
      principal: sortedScores[0],
      secundario: sortedScores[1]
    }
  }

  const handleNext = () => {
    if (selectedAnswer === null) return

    // Salvar resposta
    const newAnswers = { ...answers, [currentQuestion]: selectedAnswer }
    setAnswers(newAnswers)

    // Após pergunta 3 (índice 2), mostrar tela de transi��ão primeiro
    if (currentQuestion === 2) {
      const eixoDominante = calculatePartialProfile(newAnswers)
      setEixoParcialDominante(eixoDominante)
      setShowTransitionScreen(true)
    }
    // Após pergunta 6 (índice 5), mostrar segundo feedback dinâmico
    else if (currentQuestion === 5) {
      const eixoDominante = calculatePartialProfile(newAnswers)
      setEixoParcialDominante(eixoDominante)
      setShowFeedbackP6(true)
    }
    else if (isLastQuestion) {
      // Calcular perfil mas NÃO mostrar resultado ainda
      const { principal, secundario } = calculateProfile(newAnswers)
      setPerfilPrincipal(principal)
      setPerfilSecundario(secundario)
      // Mostrar tela de pré-diagnóstico antes da captura de dados
      setShowPreDiagnostico(true)
    } else {
      // Próxima pergunta
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(answers[currentQuestion + 1] ?? null)
    }
  }

  const handleContinueFromComparativa = () => {
    setShowComparativa(false)
    setCurrentQuestion(3) // Ir para pergunta 4 (índice 3)
    setSelectedAnswer(answers[3] ?? null)
  }

  const handleContinueFromFeedbackP3 = () => {
    setShowFeedbackP3(false)
    setCurrentQuestion(3) // Ir para pergunta 4 (índice 3)
    setSelectedAnswer(answers[3] ?? null)
  }

  const handleContinueFromFeedbackP6 = () => {
    setShowFeedbackP6(false)
    setShowProjecaoClinica(true)
  }

  const handleContinueFromProjecaoClinica = () => {
    setShowProjecaoClinica(false)
    setCurrentQuestion(6) // Ir para pergunta 7 (índice 6)
    setSelectedAnswer(answers[6] ?? null)
  }

  const handleContinueFromDiagnostico = () => {
    setShowDiagnosticoComparacao(false)
    setShowProjecaoResultados(true)
  }

  const handleContinueFromProjecao = () => {
    setShowProjecaoResultados(false)
    setCurrentQuestion(3) // Ir para pergunta 4 (índice 3)
    setSelectedAnswer(answers[3] ?? null)
  }

  const currentQ = quizQuestions[currentQuestion]

  // Validação de email
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  // Máscara de telefone WhatsApp
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').substring(0, 15)
    }
    return numbers.substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  // MODO DEBUG: pular direto para o diagnóstico final
  if (isDebugMode && debugPerfil) {
    const profilePrincipal = profiles[debugPerfil]
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-4xl">
          <Card className={`border-2 ${profilePrincipal.borderColor} shadow-2xl`}>
            <CardContent className="p-8 md:p-12">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 ${profilePrincipal.bgColor} ${profilePrincipal.color} border ${profilePrincipal.borderColor}`}>
                DEBUG: Perfil {debugPerfil.charAt(0).toUpperCase() + debugPerfil.slice(1)}
              </div>
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${profilePrincipal.color}`}>{profilePrincipal.title}</h2>
              <p className="text-base text-foreground mb-6">{profilePrincipal.descricao}</p>
              <div className={`${profilePrincipal.bgColor} rounded-xl p-6 border ${profilePrincipal.borderColor} mb-6`}>
                <p className="font-semibold text-sm mb-1 text-muted-foreground">RISCO</p>
                <p className={`${profilePrincipal.color} font-medium`}>{profilePrincipal.risco}</p>
              </div>
              <div className={`${profilePrincipal.bgColor} rounded-xl p-6 border ${profilePrincipal.borderColor}`}>
                <p className="font-semibold text-sm mb-1 text-muted-foreground">POTENCIAL</p>
                <p className={`${profilePrincipal.color} font-medium`}>{profilePrincipal.potencial}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // TELA PRÉ-DIAGNÓSTICO (entre Q10 e captura de dados)
  if (showPreDiagnostico) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-100/75 to-purple-200/55">
        {/* Fundo premium */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(168, 85, 247, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 70%, rgba(192, 132, 252, 0.14) 0%, transparent 55%)
          `,
        }}></div>

        <div className="w-full max-w-lg relative z-10">
          <div className="border-2 border-purple-200/80 shadow-2xl backdrop-blur-sm bg-white/95 rounded-2xl overflow-hidden px-6 py-8 md:px-10 md:py-10 flex flex-col gap-6">

            {/* Logo */}
            <div className="flex justify-center">
              <span className="text-base font-bold tracking-wide text-purple-700 uppercase">AutoClinic.ai</span>
            </div>

            {/* Barra de progresso ~80% */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-purple-700">Análise concluída</span>
                <span className="text-xs font-bold text-purple-700">80%</span>
              </div>
              <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400"
                  style={{ width: '80%', transition: 'width 1s ease' }}
                ></div>
              </div>
            </div>

            {/* Título */}
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Pré-diagnóstico da sua clínica
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-500">
                Com base nas suas respostas, já conseguimos identificar alguns padrões importantes na estrutura da sua clínica.
              </p>
            </div>

            {/* Cards de padrões */}
            <div className="flex flex-col gap-3">
              {/* Card 1 */}
              <div className="flex items-center gap-4 bg-purple-50/70 border border-purple-200/60 rounded-xl px-4 py-4 backdrop-blur-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Clínica em fase de crescimento</p>
                  <p className="text-xs text-gray-500 mt-0.5">Potencial identificado para expansão estruturada</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex items-center gap-4 bg-amber-50/70 border border-amber-200/60 rounded-xl px-4 py-4 backdrop-blur-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Alto potencial de aumento de faturamento</p>
                  <p className="text-xs text-gray-500 mt-0.5">Oportunidades de receita ainda não exploradas</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex items-center gap-4 bg-blue-50/70 border border-blue-200/60 rounded-xl px-4 py-4 backdrop-blur-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Possível perda de pacientes por demora no atendimento</p>
                  <p className="text-xs text-gray-500 mt-0.5">Padrão detectado no tempo de resposta e agendamento</p>
                </div>
              </div>
            </div>

            {/* Nota informativa */}
            <p className="text-center text-xs text-gray-400 -mt-1">
              Estes são indicativos iniciais. Seu diagnóstico completo será revelado a seguir.
            </p>

            {/* Botão */}
            <button
              onClick={() => {
                setShowPreDiagnostico(false)
                setShowProvaSocial(true)
              }}
              className="w-full py-4 text-base font-bold text-white rounded-xl bg-purple-700 hover:bg-purple-800 transition-colors shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)]"
            >
              Continuar análise
            </button>
          </div>
        </div>
      </div>
    )
  }

  // TELA PROVA SOCIAL (entre pré-diagnóstico e captura de dados)
  if (showProvaSocial) {
    const depoimentos = [
      {
        texto: "Antes eu passava horas respondendo pacientes no WhatsApp. Hoje o AutoClinic.ai responde automaticamente e minha agenda ficou muito mais organizada.",
        nome: "Dra. Aline Almeida",
        cargo: "biomédica estética",
      },
      {
        texto: "Eu percebi que perdia muitos pacientes por demora na resposta. Depois que comecei a automatizar o atendimento, minha conversão aumentou bastante.",
        nome: "Mariana",
        cargo: "biomédica estética",
      },
      {
        texto: "Minha clínica começou a crescer rápido e eu estava ficando sobrecarregada. Com automação e organização dos processos, tudo ficou muito mais controlado.",
        nome: "Camila Rodrigues",
        cargo: "biomédica estética",
      },
      {
        texto: "Eu tinha faturamento, mas pouca previsibilidade. Depois que comecei a acompanhar os números com mais clareza, minha gestão mudou completamente.",
        nome: "Fernanda Dourado",
        cargo: "biomédica estética",
      },
      {
        texto: "Hoje consigo focar nos procedimentos enquanto o sistema organiza atendimento, agenda e contato com pacientes.",
        nome: "Bruna",
        cargo: "biomédica estética",
      },
      {
        texto: "Eu não imaginava que um sistema poderia ajudar tanto na organização da clínica. Hoje minha rotina está muito mais leve.",
        nome: "Renata",
        cargo: "biomédica estética",
      },
    ]

    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-100/75 to-purple-200/55" style={{ height: '100dvh' }}>
        {/* Fundo premium */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(168, 85, 247, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 70%, rgba(192, 132, 252, 0.14) 0%, transparent 55%)
          `,
        }}></div>

        <div className="w-full max-w-lg relative z-10 flex flex-col h-full max-h-[100dvh] py-4 px-0">
          <div className="border-2 border-purple-200/80 shadow-2xl backdrop-blur-sm bg-white/95 rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100dvh - 2rem)' }}>

            {/* Topo fixo */}
            <div className="px-6 pt-6 pb-3 md:px-8 flex-shrink-0 flex flex-col gap-3">
              {/* Logo */}
              <div className="flex justify-center">
                <span className="text-base font-bold tracking-wide text-purple-700 uppercase">AutoClinic.ai</span>
              </div>

              {/* Barra de progresso ~85% */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-purple-700">Análise concluída</span>
                  <span className="text-xs font-bold text-purple-700">85%</span>
                </div>
                <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600"
                    style={{ width: '85%', transition: 'width 1s ease' }}
                  ></div>
                </div>
              </div>

              {/* Título principal */}
              <div className="text-center">
                <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                  347 clínicas de estética como a sua já utilizam o AutoClinic.ai
                </h1>
                <p className="mt-1 text-xs md:text-sm text-gray-500">
                  Clínicas que estruturaram seus processos com automação estão conseguindo crescer com mais previsibilidade.
                </p>
              </div>

              {/* Blocos de resultado */}
              <div className="flex gap-2">
                {/* Card 1 */}
                <div className="flex-1 flex flex-col items-center gap-1 bg-purple-50/80 border border-purple-200/60 rounded-xl px-2 py-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 text-center leading-tight">Mais faturamento</p>
                  <p className="text-[10px] text-gray-500 text-center leading-tight">Aumento consistente de receita</p>
                </div>
                {/* Card 2 */}
                <div className="flex-1 flex flex-col items-center gap-1 bg-blue-50/80 border border-blue-200/60 rounded-xl px-2 py-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 text-center leading-tight">Atendimento auto.</p>
                  <p className="text-[10px] text-gray-500 text-center leading-tight">Respostas no WhatsApp</p>
                </div>
                {/* Card 3 */}
                <div className="flex-1 flex flex-col items-center gap-1 bg-green-50/80 border border-green-200/60 rounded-xl px-2 py-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 text-center leading-tight">Mais tempo livre</p>
                  <p className="text-[10px] text-gray-500 text-center leading-tight">Foco nos procedimentos</p>
                </div>
              </div>
            </div>

            {/* Carrossel de depoimentos */}
            <div className="flex-1 min-h-0 pb-2 flex flex-col gap-2">
              <p className="text-xs font-semibold text-purple-700 text-center flex-shrink-0 px-6">O que dizem as biomédicas</p>

              {/* Wrapper do carrossel — overflow-hidden sem padding lateral para ver próximo card */}
              <div
                className="flex-1 min-h-0 relative overflow-hidden"
                style={{ paddingLeft: '16px' }}
                onTouchStart={(e) => {
                  setProvaSocialTouchStart(e.touches[0].clientX)
                  setProvaSocialPaused(true)
                }}
                onTouchEnd={(e) => {
                  if (provaSocialTouchStart === null) return
                  const diff = provaSocialTouchStart - e.changedTouches[0].clientX
                  if (diff > 40) setProvaSocialIndex(prev => (prev + 1) % PROVA_SOCIAL_TOTAL)
                  else if (diff < -40) setProvaSocialIndex(prev => (prev - 1 + PROVA_SOCIAL_TOTAL) % PROVA_SOCIAL_TOTAL)
                  setProvaSocialTouchStart(null)
                  setTimeout(() => setProvaSocialPaused(false), 4000)
                }}
              >
                {/* Track — largura = N cards × (82% do container + gap) */}
                <div
                  className="flex h-full"
                  style={{
                    transition: provaSocialTouchStart !== null ? 'none' : 'transform 500ms ease-in-out',
                    transform: `translateX(calc(-${provaSocialIndex} * (82% + 12px)))`,
                    willChange: 'transform',
                  }}
                >
                  {depoimentos.map((dep, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 h-full"
                      style={{ width: 'calc(82% - 4px)', marginRight: '12px' }}
                    >
                      <div className="h-full bg-purple-50/60 border border-purple-200/70 rounded-xl px-4 py-4 flex flex-col gap-3 backdrop-blur-sm">
                        {/* Ícone de citação */}
                        <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                          </svg>
                        </div>
                        {/* Texto */}
                        <p className="text-xs md:text-sm text-gray-700 leading-relaxed flex-1 italic">&ldquo;{dep.texto}&rdquo;</p>
                        {/* Nome */}
                        <div className="flex-shrink-0">
                          <p className="text-xs font-semibold text-gray-800">— {dep.nome}, {dep.cargo}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">usuária AutoClinic.ai</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicadores (dots) */}
              <div className="flex justify-center gap-1.5 flex-shrink-0 pb-1">
                {depoimentos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setProvaSocialIndex(idx)
                      setProvaSocialPaused(true)
                      setTimeout(() => setProvaSocialPaused(false), 4000)
                    }}
                    className={`rounded-full transition-all duration-300 ${idx === provaSocialIndex ? 'w-4 h-2 bg-purple-600' : 'w-2 h-2 bg-purple-200'}`}
                  />
                ))}
              </div>
            </div>

            {/* Botão fixo no fundo */}
            <div className="px-6 pb-5 md:px-8 flex-shrink-0">
              <button
                onClick={() => {
                  setShowProvaSocial(false)
                  setShowPreparacaoDiagnostico(true)
                }}
                className="w-full py-4 text-base font-bold text-white rounded-xl bg-purple-700 hover:bg-purple-800 transition-colors shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)]"
              >
                Continuar análise
              </button>
            </div>

          </div>
        </div>
      </div>
    )
  }

  // TELA PREPARAÇÃO PARA DIAGNÓSTICO (entre prova social e captura de dados)
  if (showPreparacaoDiagnostico) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-100/75 to-purple-200/55">
        {/* Fundo premium */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(168, 85, 247, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 70%, rgba(192, 132, 252, 0.14) 0%, transparent 55%)
          `,
        }}></div>

        <div className="w-full max-w-lg relative z-10">
          <div className="border-2 border-purple-200/80 shadow-2xl backdrop-blur-sm bg-white/95 rounded-2xl overflow-hidden px-6 py-8 md:px-10 md:py-10 flex flex-col gap-6">

            {/* Logo */}
            <div className="flex justify-center">
              <span className="text-base font-bold tracking-wide text-purple-700 uppercase">AutoClinic.ai</span>
            </div>

            {/* Barra de progresso ~90% */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-purple-700">Análise concluída</span>
                <span className="text-xs font-bold text-purple-700">90%</span>
              </div>
              <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-600"
                  style={{ width: '90%', transition: 'width 1s ease' }}
                ></div>
              </div>
            </div>

            {/* Título + subtítulo */}
            <div className="text-center flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Estamos finalizando a análise da sua clínica
              </h1>
              <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                Com base nas suas respostas, nosso sistema já identificou padrões importantes na estrutura da sua clínica.
              </p>
              <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                Agora precisamos de algumas informações para gerar seu diagnóstico completo e personalizado.
              </p>
            </div>

            {/* Cards visuais */}
            <div className="flex flex-col gap-3">
              {/* Card 1 */}
              <div className="flex items-center gap-4 bg-purple-50/70 border border-purple-200/60 rounded-xl px-4 py-4 backdrop-blur-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Análise completa da estrutura da clínica</p>
                  <p className="text-xs text-gray-500 mt-0.5">Mapeamento detalhado dos seus processos atuais</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex items-center gap-4 bg-blue-50/70 border border-blue-200/60 rounded-xl px-4 py-4 backdrop-blur-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Projeção de crescimento possível</p>
                  <p className="text-xs text-gray-500 mt-0.5">Estimativa de potencial com processos otimizados</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex items-center gap-4 bg-green-50/70 border border-green-200/60 rounded-xl px-4 py-4 backdrop-blur-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"></path><path d="M22.54 6.08a14.07 14.07 0 0 1 0 11.84M1.46 6.08a14.07 14.07 0 0 0 0 11.84"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Recomendações de otimização e automação</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ações práticas para estruturar sua clínica</p>
                </div>
              </div>
            </div>

            {/* Seção de reforço */}
            <div className="bg-purple-50/50 border border-purple-200/50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Nosso sistema irá cruzar suas respostas com dados de centenas de clínicas de estética que já utilizam o AutoClinic.ai, para gerar uma análise personalizada da sua operação.
              </p>
            </div>

            {/* Botão */}
            <button
              onClick={() => {
                setShowPreparacaoDiagnostico(false)
                setShowCaptureNome(true)
              }}
              className="w-full py-4 text-base font-bold text-white rounded-xl bg-purple-700 hover:bg-purple-800 transition-colors shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)]"
            >
              Gerar diagnóstico personalizado
            </button>

          </div>
        </div>
      </div>
    )
  }

  // TELA 1 - CAPTURA NOME
  if (showCaptureNome) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl">
          <Card className="border-2 border-purple-200 shadow-2xl">
            <CardContent className="p-10 md:p-12">
              {/* Título */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                  Antes de ver seu diagnóstico…
                </h1>
                <p className="text-xl text-muted-foreground">
                  Vamos personalizar seu diagnóstico.
                </p>
              </div>

              {/* Campo Nome */}
              <div className="mb-8">
                <label htmlFor="nome" className="block text-sm font-semibold text-foreground mb-3">
                  Seu nome
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite seu nome"
                  className="w-full px-4 py-4 text-lg border-2 border-border rounded-lg focus:outline-none focus:border-purple-500 bg-card text-foreground transition-all"
                  autoFocus
                />
              </div>

              {/* Botão */}
              <Button
                size="lg"
                onClick={() => {
                  if (nome.trim()) {
                    setShowCaptureNome(false)
                    setShowCaptureEmail(true)
                  }
                }}
                disabled={!nome.trim()}
                className="w-full text-lg font-bold py-7 bg-gradient-to-br from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)]"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // TELA 2 - CAPTURA EMAIL
  if (showCaptureEmail) {
    const emailValido = validateEmail(email)

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl">
          <Card className="border-2 border-purple-200 shadow-2xl">
            <CardContent className="p-10 md:p-12">
              {/* Título */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                  Para onde devo enviar sua análise detalhada?
                </h1>
                <p className="text-xl text-muted-foreground">
                  Seu resultado ficará salvo no seu email.
                </p>
              </div>

              {/* Campo Email */}
              <div className="mb-8">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-3">
                  Seu melhor email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className={`w-full px-4 py-4 text-lg border-2 rounded-lg focus:outline-none bg-card text-foreground transition-all ${
                    email && !emailValido
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-border focus:border-purple-500'
                  }`}
                  autoFocus
                />
                {email && !emailValido && (
                  <p className="text-red-500 text-sm mt-2">Por favor, insira um email válido.</p>
                )}
              </div>

              {/* Botão */}
              <Button
                size="lg"
                onClick={() => {
                  if (emailValido) {
                    setShowCaptureEmail(false)
                    setShowCaptureWhatsApp(true)
                  }
                }}
                disabled={!emailValido}
                className="w-full text-lg font-bold py-7 bg-gradient-to-br from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)]"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // TELA 3 - CAPTURA WHATSAPP
  if (showCaptureWhatsApp) {
    const whatsappValido = whatsapp.replace(/\D/g, '').length === 11

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl">
          <Card className="border-2 border-purple-200 shadow-2xl">
            <CardContent className="p-10 md:p-12">
              {/* Título */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                  Último passo para liberar seu diagnóstico completo.
                </h1>
                <p className="text-xl text-muted-foreground">
                  Seu diagnóstico e plano estratégico serão enviados no WhatsApp.
                </p>
              </div>

              {/* Campo WhatsApp */}
              <div className="mb-8">
                <label htmlFor="whatsapp" className="block text-sm font-semibold text-foreground mb-3">
                  Seu WhatsApp
                </label>
                <input
                  id="whatsapp"
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className={`w-full px-4 py-4 text-lg border-2 rounded-lg focus:outline-none bg-card text-foreground transition-all ${
                    whatsapp && !whatsappValido
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-border focus:border-purple-500'
                  }`}
                  maxLength={15}
                  autoFocus
                />
                {whatsapp && !whatsappValido && (
                  <p className="text-red-500 text-sm mt-2">Por favor, insira um WhatsApp válido com 11 dígitos.</p>
                )}
              </div>

              {/* Botão */}
              <Button
                size="lg"
                onClick={async () => {
                  if (whatsappValido && perfilPrincipal) {
                    try {
                      // Criar tag automática baseada no perfil principal
                      const tagPerfil = `Perfil_${perfilPrincipal.charAt(0).toUpperCase() + perfilPrincipal.slice(1)}`

                      // Salvar lead via API route (bypass do cache do PostgREST)
                      const response = await fetch('/api/save-lead', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          nome: nome,
                          whatsapp: whatsapp,
                          email: email,
                          perfil_principal: perfilPrincipal,
                          perfil_secundario: perfilSecundario,
                          score_sobrecarga: finalScores.sobrecarga,
                          score_gestao: finalScores.gestao,
                          score_conversao: finalScores.conversao,
                          score_financeiro: finalScores.financeiro,
                          tag_perfil: tagPerfil,
                          checkout_clicado: false,
                          status_compra: 'Não_Comprou',
                          data_conclusao_quiz: new Date().toISOString(),
                          influencer_ref: influencerRef
                        })
                      })

                      const result = await response.json()

                      if (!response.ok || result.error) {
                        console.error('Erro ao salvar lead:', result.error)
                      } else {
                        console.log('✅ Lead capturado e salvo no banco!', result.data)
                        // Salvar ID do lead para rastreamento posterior
                        if (result.data) {
                          setLeadId(result.data.id)
                        }
                      }

                      // Liberar resultado
                      setShowCaptureWhatsApp(false)
                      setShowResult(true)
                    } catch (err) {
                      console.error('Erro ao processar quiz:', err)
                      // Mesmo com erro, liberar resultado para não bloquear o usuário
                      setShowCaptureWhatsApp(false)
                      setShowResult(true)
                    }
                  }
                }}
                disabled={!whatsappValido}
                className="w-full text-lg font-bold py-7 bg-gradient-to-br from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)] hover:scale-105 transition-all"
              >
                Liberar meu diagnóstico
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // MICRO TELA DE TRANSIÇÃO - Após Pergunta 3
  if (showTransitionScreen) {
    // Após 1.5 segundos, avança automaticamente
    setTimeout(() => {
      setShowTransitionScreen(false)
      setShowDiagnosticoComparacao(true)
    }, 1500)

    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-100/75 to-purple-200/55">
        {/* Fundo premium */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(ellipse at 30% 40%, rgba(168, 85, 247, 0.23) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(192, 132, 252, 0.18) 0%, transparent 50%)
          `,
        }}></div>

        <div className="w-full max-w-xl relative z-10">
          <Card className="border-2 border-purple-200/80 shadow-2xl backdrop-blur-sm bg-white/95 rounded-2xl overflow-hidden">
            <CardContent className="p-8 md:p-12 space-y-6 text-center">
              {/* Título */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Seu diagnóstico está quase pronto.
              </h1>

              {/* Subtexto */}
              <p className="text-base md:text-lg text-gray-600">
                Você já respondeu 3 perguntas importantes sobre a estrutura da sua clínica.
              </p>

              {/* Indicador de carregamento */}
              <div className="py-8 flex flex-col items-center space-y-4">
                {/* Barra de progresso animada */}
                <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>

                {/* Spinner circular */}
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
              </div>

              {/* Frase final */}
              <p className="text-sm md:text-base text-gray-700 font-medium">
                Agora vamos cruzar suas respostas com padrões de clínicas estruturadas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // TELA 1 - Diagnóstico + Comparação Estrutural (após pergunta 3)
  if (showDiagnosticoComparacao) {
    return <DiagnosticoComparacao onContinue={handleContinueFromDiagnostico} />
  }

  // TELA 2 - Projeção de Resultados
  if (showProjecaoResultados) {
    return <ProjecaoResultados onContinue={handleContinueFromProjecao} />
  }

  // Feedback dinâmico após Pergunta 3
  if (showFeedbackP3 && eixoParcialDominante) {
    const feedbackP3 = {
      sobrecarga: {
        texto: "Estamos identificando um padrão de centralização excessiva nas suas decisões.",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      },
      gestao: {
        texto: "Estamos percebendo sinais de desorganização estrutural que podem estar afetando sua previsibilidade.",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200"
      },
      conversao: {
        texto: "Estamos detectando dificuldade na transformação de interesse em fechamento consistente.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      },
      financeiro: {
        texto: "Estamos identificando instabilidade na relação entre faturamento e lucro real.",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      }
    }

    const content = feedbackP3[eixoParcialDominante]

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-3xl">
          <Card className={`border-2 ${content.borderColor} shadow-2xl`}>
            <CardContent className="p-10 md:p-12">
              {/* Texto do feedback */}
              <div className={`${content.bgColor} rounded-xl p-8 border-2 ${content.borderColor} mb-8`}>
                <p className={`text-xl md:text-2xl font-semibold ${content.color} leading-relaxed text-center`}>
                  {content.texto}
                </p>
              </div>

              {/* Botão */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleContinueFromFeedbackP3}
                  className="text-lg font-bold px-12 py-7 bg-gradient-to-br from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)] hover:scale-105 transition-transform"
                >
                  Continuar análise
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Feedback dinâmico após Pergunta 6
  if (showFeedbackP6 && eixoParcialDominante) {
    const feedbackP6 = {
      sobrecarga: {
        texto: "Sua operação está dependendo mais de você do que deveria.",
        perfilLabel: "Perfil Sobrecarga",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        accentColor: "bg-red-600",
        sintomas: [
          "Dependência excessiva de decisões do proprietário",
          "Dificuldade em delegar tarefas sem perda de qualidade",
          "Dificuldade em escalar a operação sem aumentar a carga de trabalho"
        ]
      },
      gestao: {
        texto: "Falta clareza nos processos que sustentam seu crescimento.",
        perfilLabel: "Perfil Gestão",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        accentColor: "bg-purple-600",
        sintomas: [
          "Falta de processos claros entre recepção, atendimento e gestão",
          "Decisões tomadas no improviso por ausência de dados estruturados",
          "Dificuldade em escalar a operação sem aumentar a carga de trabalho"
        ]
      },
      conversao: {
        texto: "Sua capacidade técnica pode estar acima da sua estrutura comercial.",
        perfilLabel: "Perfil Conversão",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        accentColor: "bg-blue-600",
        sintomas: [
          "Dificuldade em transformar interesse em fechamento consistente",
          "Falta de diferenciação clara na experiência oferecida ao paciente",
          "Dificuldade em escalar a operação sem aumentar a carga de trabalho"
        ]
      },
      financeiro: {
        texto: "Seu faturamento pode não estar refletindo segurança financeira.",
        perfilLabel: "Perfil Financeiro",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        accentColor: "bg-green-600",
        sintomas: [
          "Instabilidade entre faturamento e lucro real por procedimento",
          "Falta de previsibilidade de receita mês a mês",
          "Dificuldade em escalar a operação sem aumentar a carga de trabalho"
        ]
      }
    }

    const content = feedbackP6[eixoParcialDominante]

    return (
      <div className="h-screen flex flex-col p-3 relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-100/75 to-purple-200/55">
        {/* Fundo premium */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(ellipse at 30% 40%, rgba(168, 85, 247, 0.23) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(192, 132, 252, 0.18) 0%, transparent 50%)
          `,
        }}></div>

        <div className="w-full max-w-2xl mx-auto relative z-10 flex flex-col h-full">
          {/* Barra de progresso */}
          <div className="mb-3 flex-shrink-0">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs font-semibold text-purple-800">Análise em andamento</p>
              <p className="text-xs font-bold text-purple-900">60%</p>
            </div>
            <div className="relative h-2 bg-white/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
              <div className="absolute top-0 left-0 h-full w-[60%] bg-purple-600 rounded-full transition-all duration-500"></div>
            </div>
          </div>

          <Card className="border-2 border-purple-200/80 shadow-2xl backdrop-blur-sm bg-white/97 rounded-2xl overflow-hidden flex-1 flex flex-col">
            <CardContent className="p-4 sm:p-5 flex flex-col h-full justify-between">

              {/* Indicação de análise parcial */}
              <div className="text-center mb-3">
                <span className="inline-block text-xs font-semibold tracking-widest uppercase text-purple-500 bg-purple-50 border border-purple-200 rounded-full px-3 py-1">
                  Análise parcial do seu diagnóstico
                </span>
              </div>

              {/* Título do primeiro padrão */}
              <div className="text-center mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Primeiro padrão identificado na sua clínica
                </p>
                <p className={`text-xs font-bold uppercase tracking-wider ${content.color}`}>
                  {content.perfilLabel}
                </p>
              </div>

              {/* Frase principal do perfil — elemento de maior destaque */}
              <div className={`${content.bgColor} rounded-xl p-4 sm:p-5 border-2 ${content.borderColor} mb-3`}>
                <p className={`text-xl sm:text-2xl font-bold ${content.color} leading-snug text-center`}>
                  &ldquo;{content.texto}&rdquo;
                </p>
              </div>

              {/* Texto contextualizador */}
              <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed mb-3">
                Com base nas suas respostas até agora, identificamos um padrão inicial que pode estar impactando a eficiência e o crescimento da sua clínica.
              </p>

              {/* Bloco de sintomas operacionais */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  O que isso normalmente significa na prática
                </p>
                <ul className="space-y-1.5">
                  {content.sintomas.map((sintoma: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${content.accentColor}`}></span>
                      <span className="text-xs text-gray-700 leading-relaxed">{sintoma}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botão principal */}
              <Button
                size="lg"
                onClick={handleContinueFromFeedbackP6}
                className="w-full text-sm sm:text-base font-bold py-4 sm:py-5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)] transition-all duration-300 flex-shrink-0"
              >
                Continuar análise
              </Button>

            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Projeção da cl��nica (após feedback P6)
  if (showProjecaoClinica) {
    return <ProjecaoClinica onContinue={handleContinueFromProjecaoClinica} />
  }
  // Tela comparativa após pergunta 3
  if (showComparativa && eixoParcialDominante) {
    const comparativaContent = {
      sobrecarga: {
        titulo: "Existe um padrão de sobrecarga começando a aparecer.",
        lado1: "Empreendedoras que centralizam tudo e vivem no limite",
        lado2: "Empreendedoras que estruturam processos e liberam crescimento",
        textoFinal: "Nos próximos passos vamos confirmar se isso é estrutural.",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      },
      financeiro: {
        titulo: "Existe um padrão de instabilidade financeira aparecendo.",
        lado1: "Negócios que faturam mas não constroem previsibilidade",
        lado2: "Negócios que crescem com consistência e controle",
        textoFinal: "Nos próximos passos vamos confirmar se isso é estrutural.",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      },
      gestao: {
        titulo: "Existe um padrão de fragmentação estrutural.",
        lado1: "Decidir no improviso",
        lado2: "Operar com método e clareza estratégica",
        textoFinal: "Nos próximos passos vamos confirmar se isso é estrutural.",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200"
      },
      conversao: {
        titulo: "Existe uma limitação na experiência de venda.",
        lado1: "Oferta genérica",
        lado2: "Posicionamento estratégico e conversão estruturada",
        textoFinal: "Nos próximos passos vamos confirmar se isso é estrutural.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      }
    }

    const content = comparativaContent[eixoParcialDominante]

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-4xl">
          <Card className={`border-2 ${content.borderColor} shadow-2xl`}>
            <CardContent className="p-10 md:p-12">
              {/* Título */}
              <div className="text-center mb-12">
                <h1 className={`text-3xl md:text-4xl font-bold ${content.color} leading-tight mb-4`}>
                  {content.titulo}
                </h1>
              </div>

              {/* Comparação Visual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Lado Negativo */}
                <div className="bg-muted/30 border-2 border-muted rounded-xl p-8 text-center">
                  <div className="text-4xl mb-4">❌</div>
                  <p className="text-lg font-semibold text-foreground/80 leading-relaxed">
                    {content.lado1}
                  </p>
                </div>

                {/* Lado Positivo */}
                <div className={`${content.bgColor} border-2 ${content.borderColor} rounded-xl p-8 text-center`}>
                  <div className="text-4xl mb-4">✅</div>
                  <p className={`text-lg font-semibold ${content.color} leading-relaxed`}>
                    {content.lado2}
                  </p>
                </div>
              </div>

              {/* Texto Final */}
              <div className="text-center mb-8">
                <p className="text-xl text-foreground/80 font-medium">
                  {content.textoFinal}
                </p>
              </div>

              {/* Botão */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleContinueFromComparativa}
                  className="text-lg font-bold px-12 py-7 bg-gradient-to-br from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)] hover:scale-105 transition-transform"
                >
                  Continuar meu diagnóstico
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela inicial premium
  // Tela inicial premium - NOVA VERSÃO MOBILE FIRST
  if (!showQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative bg-gradient-to-b from-pink-50 via-purple-100 to-purple-200">
        {/* Textura com ondas e glow sutil */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(192, 132, 252, 0.25) 0%, transparent 50%),
            repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(168, 85, 247, 0.03) 60px, rgba(168, 85, 247, 0.03) 120px)
          `,
        }}></div>

        {/* Ondas decorativas */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="rgba(168, 85, 247, 0.1)" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="flex flex-col justify-between h-full space-y-6">

            {/* 🔝 BLOCO 1 — HEADLINE + SUBHEADLINE */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
                Transforme sua clínica<br />
                em um <span className="text-purple-700 font-extrabold">sistema inteligente</span><br />
                que <span className="text-purple-700 font-extrabold">atende, agenda</span> e<br />
                <span className="text-purple-700 font-extrabold">vende automaticamente</span>.
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Pare de perder pacientes no WhatsApp e<br />
                de depender apenas da sua energia para crescer.
              </p>
            </div>

            {/* 💎 BLOCO 2 — CARD DE BENEFÍCIOS */}
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 shadow-[0_8px_30px_rgba(168,85,247,0.12)] border border-white/60">
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-sm sm:text-base font-medium">Atendimento automático 24h</p>
                </div>

                <div className="h-px bg-gray-300/40"></div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-sm sm:text-base font-medium">Respostas estratégicas que aumentam conversão</p>
                </div>

                <div className="h-px bg-gray-300/40"></div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-sm sm:text-base font-medium">Agenda organizada e previsível</p>
                </div>
              </div>

              {/* Tempo estimado */}
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-300/40">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-500">Leva menos de 3 minutos</p>
              </div>
            </div>

            {/* 🚀 BLOCO 3 — CTA + PROVA SOCIAL */}
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={() => setShowQuiz(true)}
                className="w-full h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-700 via-purple-600 to-purple-400 hover:from-purple-800 hover:via-purple-700 hover:to-purple-500 text-white rounded-2xl shadow-[0_8px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_12px_28px_rgba(126,34,206,0.45)] transition-all duration-300"
              >
                Quero Ativar Meu Sistema Inteligente
              </Button>

              {/* Prova social */}
              <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed font-medium">
                Mais de 347 clínicas já utilizam a <span className="text-purple-700 font-semibold">autoclinic.ia</span> para lucrar mais.
              </p>
            </div>

          </div>
        </div>
      </div>
    )
  }

  if (showResult && perfilPrincipal && showConfirmacaoFromOffer) {
    return <ConfirmacaoPagamento onEntrar={() => handleCheckoutClick()} />
  }

  if (showResult && perfilPrincipal && showDownsellFromOffer) {
    const couponParam = influencerRef && influencerRef !== 'clecio' ? `&coupon=${influencerRef}` : ''
    return (
      <Downsell
        onAceitar={() => { window.location.href = `https://app.autoclinicai.com.br/checkout?reseller=clecio&plan=starter&interval=annual&promo=true${couponParam}` }}
        onRecusar={() => handleCheckoutClick()}
      />
    )
  }

  if (showResult && perfilPrincipal && showCheckoutFinal) {
    return <CheckoutFinal plano={planoSelecionado} onCheckout={handleCheckoutClick} influencerRef={influencerRef} />
  }

  if (showResult && perfilPrincipal && showEscolhaPlanos) {
    return (
      <TelaEscolhaPlanos
        onEscolherMensal={() => { setPlanoSelecionado('mensal'); setShowCheckoutFinal(true) }}
        onEscolherAnual={() => { setPlanoSelecionado('anual'); setShowCheckoutFinal(true) }}
        onFechar={() => setShowDownsellFromOffer(true)}
      />
    )
  }

  if (showResult && perfilPrincipal && showOfertaPrincipal) {
    return (
      <TelaOfertaPrincipal
        onAtivar={() => { setPlanoSelecionado('anual'); setShowCheckoutFinal(true) }}
        onVerPlanos={() => setShowEscolhaPlanos(true)}
        onFechar={() => setShowDownsellFromOffer(true)}
      />
    )
  }

  if (showResult && perfilPrincipal) {
    const profilePrincipal = profiles[perfilPrincipal]
    const profileSecundario = perfilSecundario ? profiles[perfilSecundario] : null

    // ─── DIAGNÓSTICO SOBRECARGA ───────────────────────────────────────────────
    if (perfilPrincipal === 'sobrecarga') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-3 py-6">
          <div className="w-full max-w-lg">
            <Card className="border-2 border-red-200 shadow-xl">
              <CardContent className="p-4 sm:p-6 space-y-3">

                {/* BLOCO 1 — IDENTIFICAÇÃO DO PERFIL */}
                <div className="text-center pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">
                    Perfil estratégico identificado
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-red-600 leading-tight">
                    Empreendedora Sobrecarregada
                  </h1>
                  <p className="text-xs sm:text-sm text-foreground/60 mt-1 leading-relaxed">
                    Seu crescimento hoje depende mais da sua energia do que da estrutura da clínica.
                  </p>
                </div>

                <div className="border-t border-border/30"></div>

                {/* BLOCO 2 — INDICADOR DO DIAGNÓSTICO */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-2">
                    Nível de sobrecarga operacional
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-red-600 leading-none">82%</span>
                    <div className="flex-1">
                      <div className="h-2.5 bg-red-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground/50 mt-2">
                    Outros fatores detectados pelo sistema:
                  </p>
                  <p className="text-xs font-semibold text-foreground/70 mt-0.5">
                    Gestão&nbsp;&nbsp;•&nbsp;&nbsp;Conversão&nbsp;&nbsp;•&nbsp;&nbsp;Financeiro
                  </p>
                </div>

                {/* BLOCO 3 — O QUE ESSE PADRÃO REVELA */}
                <div className="bg-muted/30 border border-border rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                    O que esse padrão revela
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      'Você resolve grande parte das demandas da clínica',
                      'Muitas tarefas operacionais dependem diretamente de você',
                      'Crescer significa trabalhar ainda mais',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-foreground/80">
                        <span className="text-red-500 font-bold mt-0.5 shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-semibold text-foreground mt-2 pt-2 border-t border-border/30">
                    O crescimento acontece, mas a estrutura da clínica não acompanha.
                  </p>
                </div>

                {/* BLOCO 4 — DIREÇÃO DE SOLUÇÃO */}
                <div className="border border-border rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                    Como clínicas resolvem isso
                  </p>
                  <p className="text-xs text-foreground/60 mb-2">
                    Clínicas que deixam de operar em sobrecarga implementam três sistemas principais:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      'Atendimento automático',
                      'Organização inteligente da agenda',
                      'Gestão completa da clínica',
                    ].map((item, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-2 text-center">
                        <p className="text-[10px] sm:text-xs font-semibold text-foreground leading-tight">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BLOCO 5 — O QUE O APLICATIVO FAZ */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-2">
                    O que o aplicativo faz por você
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Chat com IA que atende pacientes 24 horas por dia',
                      'Agenda automática com confirmação e pagamento de sinal',
                      'Simulação de procedimentos com visualização antes e depois',
                      'Gestão completa de clientes e histórico',
                      'Controle financeiro da clínica',
                      'Controle de estoque com alertas de reposição',
                      'Lembretes automáticos de retorno e manutenção de procedimentos',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                        <span className="text-purple-500 font-bold mt-0.5 shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] sm:text-xs text-foreground/50 mt-2 pt-2 border-t border-purple-200 leading-relaxed">
                    Assim a biomédica deixa de ser o centro operacional da clínica e passa a focar no crescimento do negócio.
                  </p>
                </div>

                {/* BOTÃO FINAL */}
                <Button
                  size="lg"
                  onClick={handleCheckoutClick}
                  className="w-full text-sm sm:text-base font-bold py-6 bg-purple-600 hover:bg-purple-700 text-white hover:scale-[1.02] transition-transform shadow-lg rounded-xl"
                >
                  Quero estruturar minha clínica
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
    // ─── DIAGNÓSTICO GESTÃO ───────────────────────────────────────────────────
    if (perfilPrincipal === 'gestao') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-3 py-6">
          <div className="w-full max-w-lg">
            <Card className="border-2 border-purple-200 shadow-xl">
              <CardContent className="p-4 sm:p-6 space-y-3">

                {/* BLOCO 1 — IDENTIFICAÇÃO DO PERFIL */}
                <div className="text-center pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-1">
                    Perfil estratégico identificado
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-purple-600 leading-tight">
                    Gestora Fragmentada
                  </h1>
                  <p className="text-xs sm:text-sm text-foreground/60 mt-1 leading-relaxed">
                    Sua clínica tem potencial de crescimento, mas a organização da gestão ainda não acompanha esse potencial.
                  </p>
                </div>

                <div className="border-t border-border/30"></div>

                {/* BLOCO 2 — INDICADOR DO DIAGNÓSTICO */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500 mb-2">
                    Nível de desorganização na gestão
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-purple-600 leading-none">78%</span>
                    <div className="flex-1">
                      <div className="h-2.5 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground/50 mt-2">
                    Outros fatores detectados pelo sistema:
                  </p>
                  <p className="text-xs font-semibold text-foreground/70 mt-0.5">
                    Sobrecarga&nbsp;&nbsp;•&nbsp;&nbsp;Conversão&nbsp;&nbsp;•&nbsp;&nbsp;Financeiro
                  </p>
                </div>

                {/* BLOCO 3 — O QUE ESSE PADRÃO REVELA */}
                <div className="bg-muted/30 border border-border rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                    O que esse padrão revela
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      'Informações importantes ficam espalhadas ou sem registro',
                      'Decisões da clínica acontecem sem dados claros',
                      'Falta de organização gera retrabalho e perda de eficiência',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-foreground/80">
                        <span className="text-purple-500 font-bold mt-0.5 shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-semibold text-foreground mt-2 pt-2 border-t border-border/30">
                    Sem organização na gestão, o crescimento da clínica se torna instável.
                  </p>
                </div>

                {/* BLOCO 4 — DIREÇÃO DE SOLUÇÃO */}
                <div className="border border-border rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                    Como clínicas resolvem isso
                  </p>
                  <p className="text-xs text-foreground/60 mb-2">
                    Clínicas que crescem de forma estruturada organizam três áreas principais:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      'Centralização das informações da clínica',
                      'Controle claro de pacientes e procedimentos',
                      'Gestão financeira e operacional integrada',
                    ].map((item, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-2 text-center">
                        <p className="text-[10px] sm:text-xs font-semibold text-foreground leading-tight">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BLOCO 5 — O QUE O APLICATIVO FAZ */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-2">
                    O que o aplicativo faz por você
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Gestão completa de clientes com histórico e galeria de procedimentos',
                      'Agenda organizada com status e notas',
                      'Controle financeiro com receitas e despesas',
                      'Controle de estoque com alertas de reposição',
                      'Alertas inteligentes para retornos e manutenção de procedimentos',
                      'Simulador de procedimentos para visualizar antes e depois',
                      'Chat com IA que pode atender pacientes automaticamente',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                        <span className="text-purple-500 font-bold mt-0.5 shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] sm:text-xs text-foreground/50 mt-2 pt-2 border-t border-purple-200 leading-relaxed">
                    Assim a biomédica deixa de depender de memória ou anotações dispersas e passa a ter controle real da clínica.
                  </p>
                </div>

                {/* BOTÃO FINAL */}
                <Button
                  size="lg"
                  onClick={handleCheckoutClick}
                  className="w-full text-sm sm:text-base font-bold py-6 bg-purple-600 hover:bg-purple-700 text-white hover:scale-[1.02] transition-transform shadow-lg rounded-xl"
                >
                  Quero organizar minha clínica
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
    // ─── DIAGNÓSTICO CONVERSÃO ────────────────────────────────────────────────
    if (perfilPrincipal === 'conversao') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-3 py-6">
          <div className="w-full max-w-lg">
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardContent className="p-4 sm:p-6 space-y-3">

                {/* BLOCO 1 — IDENTIFICAÇÃO DO PERFIL */}
                <div className="text-center pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
                    Perfil estratégico identificado
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-blue-600 leading-tight">
                    Especialista com Baixa Conversão
                  </h1>
                  <p className="text-xs sm:text-sm text-foreground/60 mt-1 leading-relaxed">
                    Sua clínica gera interesse dos pacientes, mas muitos atendimentos não se transformam em procedimentos fechados.
                  </p>
                </div>

                <div className="border-t border-border/30"></div>

                {/* BLOCO 2 — INDICADOR DO DIAGNÓSTICO */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-2">
                    Nível de perda de conversão
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-blue-600 leading-none">74%</span>
                    <div className="flex-1">
                      <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '74%' }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground/50 mt-2">
                    Outros fatores detectados pelo sistema:
                  </p>
                  <p className="text-xs font-semibold text-foreground/70 mt-0.5">
                    Sobrecarga&nbsp;&nbsp;•&nbsp;&nbsp;Gestão&nbsp;&nbsp;•&nbsp;&nbsp;Financeiro
                  </p>
                </div>

                {/* BLOCO 3 — O QUE ESSE PADRÃO REVELA */}
                <div className="bg-muted/30 border border-border rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                    O que esse padrão revela
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      'Muitos pacientes pedem informações mas não finalizam procedimentos',
                      'O atendimento inicial não conduz o paciente para a decisão',
                      'O potencial de faturamento da clínica não está sendo aproveitado',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-foreground/80">
                        <span className="text-blue-500 font-bold mt-0.5 shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-semibold text-foreground mt-2 pt-2 border-t border-border/30">
                    Existe demanda, mas parte dela se perde antes de virar resultado.
                  </p>
                </div>

                {/* BLOCO 4 — DIREÇÃO DE SOLUÇÃO */}
                <div className="border border-border rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                    Como clínicas resolvem isso
                  </p>
                  <p className="text-xs text-foreground/60 mb-2">
                    Clínicas que aumentam sua conversão estruturam três pontos principais:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      'Atendimento mais estratégico aos pacientes',
                      'Demonstração clara do resultado esperado',
                      'Processo que conduz o paciente à decisão',
                    ].map((item, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-2 text-center">
                        <p className="text-[10px] sm:text-xs font-semibold text-foreground leading-tight">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BLOCO 5 — O QUE O APLICATIVO FAZ */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2">
                    O que o aplicativo faz por você
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Chat com IA que responde pacientes 24 horas por dia',
                      'Atendimento automatizado que conduz o paciente para o agendamento',
                      'Simulador de procedimentos para visualizar antes e depois',
                      'Agenda organizada com confirmação automática',
                      'Histórico completo dos pacientes e procedimentos realizados',
                      'Gestão da clínica com dados organizados para acompanhar resultados',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                        <span className="text-blue-500 font-bold mt-0.5 shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] sm:text-xs text-foreground/50 mt-2 pt-2 border-t border-blue-200 leading-relaxed">
                    Assim a biomédica deixa de depender apenas da conversa manual para fechar procedimentos e passa a contar com um sistema que ajuda a converter pacientes.
                  </p>
                </div>

                {/* BOTÃO FINAL */}
                <Button
                  size="lg"
                  onClick={handleCheckoutClick}
                  className="w-full text-sm sm:text-base font-bold py-6 bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] transition-transform shadow-lg rounded-xl"
                >
                  Quero aumentar minhas conversões
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
    // ─── DIAGNÓSTICO FINANCEIRO ───────────────────────────────────────────────
    if (perfilPrincipal === 'financeiro') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-3 py-6">
          <div className="w-full max-w-lg">
            <Card className="border-2 border-emerald-200 shadow-xl">
              <CardContent className="p-4 sm:p-6 space-y-3">

                {/* BLOCO 1 — IDENTIFICAÇÃO DO PERFIL */}
                <div className="text-center pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">
                    Perfil estratégico identificado
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-emerald-600 leading-tight">
                    Clínica com Descontrole Financeiro
                  </h1>
                  <p className="text-xs sm:text-sm text-foreground/60 mt-1 leading-relaxed">
                    Sua clínica pode estar faturando bem, mas a falta de controle financeiro dificulta entender o resultado real do negócio.
                  </p>
                </div>

                <div className="border-t border-border/30"></div>

                {/* BLOCO 2 — INDICADOR DO DIAGNÓSTICO */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-2">
                    Nível de desorganização financeira
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-600 leading-none">76%</span>
                    <div className="flex-1">
                      <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '76%' }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground/50 mt-2">
                    Outros fatores detectados pelo sistema:
                  </p>
                  <p className="text-xs font-semibold text-foreground/70 mt-0.5">
                    Sobrecarga&nbsp;&nbsp;•&nbsp;&nbsp;Gestão&nbsp;&nbsp;•&nbsp;&nbsp;Conversão
                  </p>
                </div>

                {/* BLOCO 3 — O QUE ESSE PADRÃO REVELA */}
                <div className="bg-muted/30 border border-border rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                    O que esse padrão revela
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      'Falta de controle claro sobre entradas e despesas da clínica',
                      'Dificuldade para visualizar lucro real dos procedimentos',
                      'Decisões financeiras sendo tomadas sem dados organizados',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-foreground/80">
                        <span className="text-emerald-500 font-bold mt-0.5 shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-semibold text-foreground mt-2 pt-2 border-t border-border/30">
                    A clínica trabalha e fatura, mas o dinheiro não é acompanhado com precisão.
                  </p>
                </div>

                {/* BLOCO 4 — DIREÇÃO DE SOLUÇÃO */}
                <div className="border border-border rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2">
                    Como clínicas resolvem isso
                  </p>
                  <p className="text-xs text-foreground/60 mb-2">
                    Clínicas que crescem de forma sustentável estruturam três pontos financeiros essenciais:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      'Controle completo das receitas e despesas',
                      'Organização das categorias financeiras da clínica',
                      'Acompanhamento claro do desempenho financeiro',
                    ].map((item, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-2 text-center">
                        <p className="text-[10px] sm:text-xs font-semibold text-foreground leading-tight">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BLOCO 5 — O QUE O APLICATIVO FAZ */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2">
                    O que o aplicativo faz por você
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Controle financeiro com registro de receitas e despesas',
                      'Organização por categorias financeiras',
                      'Histórico completo de procedimentos e clientes',
                      'Agenda integrada com gestão da clínica',
                      'Controle de estoque com alertas de reposição',
                      'Simulação de procedimentos com visualização antes e depois',
                      'Chat com IA que atende pacientes automaticamente',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                        <span className="text-emerald-500 font-bold mt-0.5 shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] sm:text-xs text-foreground/50 mt-2 pt-2 border-t border-emerald-200 leading-relaxed">
                    Assim a biomédica passa a enxergar com clareza os números da clínica e consegue tomar decisões com base em dados reais.
                  </p>
                </div>

                {/* BOTÃO FINAL */}
                <Button
                  size="lg"
                  onClick={handleCheckoutClick}
                  className="w-full text-sm sm:text-base font-bold py-6 bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02] transition-transform shadow-lg rounded-xl"
                >
                  Quero organizar minhas finanças
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
    // ─────────────────────────────────────────────────────────────────────────

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-4xl">
          <Card className={`border-2 ${profilePrincipal.borderColor} shadow-2xl`}>
            <CardContent className="p-10 md:p-12 space-y-10">

              {/* 🔥 BLOCO 1 — Perfil Principal */}
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-lg text-muted-foreground mb-4 font-medium">
                    Seu Perfil Estratégico Principal é:
                  </p>
                  <div className="text-6xl mb-6">{profilePrincipal.emoji}</div>
                  <h1 className={`text-3xl md:text-4xl font-bold ${profilePrincipal.color} mb-6`}>
                    {profilePrincipal.title}
                  </h1>
                </div>

                {/* Descrição do padrão comportamental */}
                <div className={`${profilePrincipal.bgColor} rounded-xl p-6 border-2 ${profilePrincipal.borderColor}`}>
                  <p className="text-lg text-foreground leading-relaxed">
                    {profilePrincipal.descricao}
                  </p>
                </div>

                {/* Principais sintomas */}
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">Principais sintomas:</h2>
                  <ul className="space-y-3">
                    {profilePrincipal.sintomas.map((sintoma, index) => (
                      <li key={index} className="flex items-start">
                        <span className={`${profilePrincipal.color} font-bold mr-3 mt-1`}>•</span>
                        <span className="text-base text-foreground/80">{sintoma}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risco se continuar assim */}
                <div className="bg-muted/30 rounded-xl p-6 border-2 border-muted">
                  <h2 className="text-lg font-bold text-foreground mb-3">⚠️ O risco se você continuar assim:</h2>
                  <p className="text-base text-foreground/80 leading-relaxed">
                    {profilePrincipal.risco}
                  </p>
                </div>

                {/* Potencial oculto */}
                <div className={`${profilePrincipal.bgColor} rounded-xl p-6 border-2 ${profilePrincipal.borderColor}`}>
                  <h2 className={`text-lg font-bold ${profilePrincipal.color} mb-3`}>✨ Mas aqui está seu potencial oculto:</h2>
                  <p className="text-base text-foreground leading-relaxed">
                    {profilePrincipal.potencial}
                  </p>
                </div>
              </div>

              {/* Divisor */}
              <div className="border-t-2 border-border"></div>

              {/* 🔎 BLOCO 2 — Perfil Secundário */}
              {profileSecundario && perfilSecundario && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-lg text-muted-foreground font-medium mb-6">
                      Mas existe um segundo fator influenciando seu crescimento:
                    </p>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-4xl">{profileSecundario.emoji}</div>
                      <h2 className={`text-2xl md:text-3xl font-bold ${profileSecundario.color}`}>
                        {profileSecundario.title}
                      </h2>
                    </div>
                  </div>

                  {/* Explicação da influência do perfil secundário sobre o principal */}
                  <div className={`${profileSecundario.bgColor} rounded-xl p-6 border-2 ${profileSecundario.borderColor}`}>
                    <p className="text-base text-foreground leading-relaxed">
                      {profilePrincipal.influencia_secundaria[perfilSecundario as keyof typeof profilePrincipal.influencia_secundaria]}
                    </p>
                  </div>
                </div>
              )}

              {/* Divisor */}
              <div className="border-t-2 border-border"></div>

              {/* 📌 BLOCO 3 — Conclusão Estratégica */}
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    Seu crescimento não depende de mais esforço.
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold ${profilePrincipal.color} leading-tight`}>
                    Depende de corrigir o eixo certo.
                  </div>
                </div>

                {/* Divisor sutil */}
                <div className="border-t border-border/50 my-8"></div>

                {/* 🔹 BLOCO DE AUTORIDADE E VALIDAÇÃO */}
                <div className="space-y-6">
                  {/* Subtítulo */}
                  <div className="text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                      Como identificamos isso?
                    </h3>
                  </div>

                  {/* Texto explicativo */}
                  <div className="bg-muted/30 rounded-xl p-6 md:p-8 border border-border">
                    <p className="text-base md:text-lg text-foreground leading-relaxed text-center mb-4">
                      Seu diagnóstico não é baseado em achismos.
                    </p>
                    <p className="text-base text-foreground/80 leading-relaxed text-center">
                      Ele cruza padrões comportamentais, decisões estratégicas e indicadores de maturidade empresarial.
                    </p>
                  </div>

                  {/* Mini prova social estratégica */}
                  <div className="text-center">
                    <div className="inline-block bg-primary/5 rounded-lg px-6 py-3 border border-primary/20">
                      <p className="text-sm md:text-base font-semibold text-foreground/80">
                        + de <span className="text-primary font-bold">500</span> empreendedoras já passaram por esse diagnóstico.
                      </p>
                    </div>
                  </div>

                  {/* Reforço de método */}
                  <div className={`${profilePrincipal.bgColor} rounded-xl p-6 border-2 ${profilePrincipal.borderColor}`}>
                    <p className="text-base md:text-lg text-foreground leading-relaxed text-center">
                      Negócios que corrigem o eixo estrutural certo crescem com previsibilidade.
                      <br />
                      <span className="font-bold">Negócios que insistem no eixo errado apenas aumentam esforço.</span>
                    </p>
                  </div>
                </div>

                {/* Divisor antes da oferta */}
                <div className="border-t-2 border-border my-10"></div>

                {/* 🎯 OFERTA ADAPTATIVA POR PERFIL */}
                <div className="space-y-8">
                  {/* Headline personalizada por perfil */}
                  <div className="text-center">
                    <h2 className={`text-2xl md:text-3xl font-bold ${profilePrincipal.color} leading-tight mb-6`}>
                      {perfilPrincipal === 'gestao' && "Seu negócio precisa de direção, não de mais tarefas."}
                      {perfilPrincipal === 'conversao' && "Você não precisa de mais seguidores. Precisa de conversão."}
                      {perfilPrincipal === 'financeiro' && "Faturar não é o mesmo que crescer."}
                    </h2>
                  </div>

                  {/* Promessa específica */}
                  <div className="text-center">
                    <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                      {perfilPrincipal === 'gestao' && "Clareza estratégica e método de gestão."}
                      {perfilPrincipal === 'conversao' && "Transformar posicionamento em vendas previsíveis."}
                      {perfilPrincipal === 'financeiro' && "Construir previsibilidade financeira."}
                    </p>
                  </div>

                  {/* 3 pilares estratégicos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    {perfilPrincipal === 'gestao' && (
                      <>
                        <div className="bg-card border-2 border-border rounded-xl p-6 text-center">
                          <p className="font-semibold text-foreground">Planejamento estratégico</p>
                        </div>
                        <div className="bg-card border-2 border-border rounded-xl p-6 text-center">
                          <p className="font-semibold text-foreground">Organização de metas</p>
                        </div>
                        <div className="bg-card border-2 border-border rounded-xl p-6 text-center">
                          <p className="font-semibold text-foreground">Estrutura de acompanhamento</p>
                        </div>
                      </>
                    )}
                    {perfilPrincipal === 'conversao' && (
                      <>
                        <div className="bg-card border-2 border-border rounded-xl p-6 text-center">
                          <p className="font-semibold text-foreground">Ajuste de oferta</p>
                        </div>
                        <div className="bg-card border-2 border-border rounded-xl p-6 text-center">
                          <p className="font-semibold text-foreground">Estrutura de funil</p>
                        </div>
                        <div className="bg-card border-2 border-border rounded-xl p-6 text-center">
                          <p className="font-semibold text-foreground">Comunicação estratégica</p>
                        </div>
                      </>
                    )}
                    {perfilPrincipal === 'financeiro' && (
                      <>
                        <div className="bg-card border-2 border-border rounded-xl p-6 text-center">
                          <p className="font-semibold text-foreground">Estrutura de precificação</p>
                        </div>
                        <div className="bg-card border-2 border-border rounded-xl p-6 text-center">
                          <p className="font-semibold text-foreground">Controle de fluxo</p>
                        </div>
                        <div className="bg-card border-2 border-border rounded-xl p-6 text-center">
                          <p className="font-semibold text-foreground">Estratégia de crescimento sustentável</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* CTA personalizado por perfil */}
                  <div className="text-center pt-6">
                    <Button
                      size="lg"
                      onClick={async () => {
                        // Registrar clique no checkout via API route
                        if (leadId) {
                          try {
                            const response = await fetch('/api/update-checkout', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ leadId })
                            })

                            const result = await response.json()

                            if (!response.ok || result.error) {
                              console.error('Erro ao registrar clique no checkout:', result.error)
                            } else {
                              console.log('✅ Clique no checkout registrado!')
                            }
                          } catch (err) {
                            console.error('Erro ao atualizar lead:', err)
                          }
                        }

                        // Aqui você pode adicionar redirecionamento para VSL ou página específica
                        // window.location.href = '/vsl-' + perfilPrincipal
                      }}
                      className="text-lg font-bold px-12 py-8 bg-purple-600 hover:bg-purple-700 text-white hover:scale-105 transition-transform shadow-2xl"
                    >
                      {perfilPrincipal === 'gestao' && "Quero organizar minha gestão"}
                      {perfilPrincipal === 'conversao' && "Quero aumentar minha conversão"}
                      {perfilPrincipal === 'financeiro' && "Quero organizar minhas finanças"}
                    </Button>
                  </div>
                </div>

                {/* 🎯 BLOCO DE UPSELL INTELIGENTE (baseado no perfil secundário) */}
                {perfilSecundario && perfilSecundario !== perfilPrincipal && (
                  <div className="mt-10">
                    {/* Divisor sutil */}
                    <div className="border-t border-border/30 mb-8"></div>

                    <div className="bg-muted/20 rounded-xl p-6 md:p-8 border border-border/50 space-y-6">
                      {/* Título do upsell */}
                      <div className="text-center">
                        <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">
                          Existe um segundo ponto que pode estar limitando seu crescimento.
                        </h3>
                      </div>

                      {/* Subtítulo dinâmico baseado no perfil secundário */}
                      <div className="text-center">
                        <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-6">
                          {perfilSecundario === 'sobrecarga' && "Mesmo com estratégia correta, a sobrecarga pode sabotar sua execução."}
                          {perfilSecundario === 'gestao' && "Sem clareza de direção, qualquer esforço vira dispersão."}
                          {perfilSecundario === 'conversao' && "Você pode organizar o negócio, mas ainda deixar dinheiro na mesa."}
                          {perfilSecundario === 'financeiro' && "Crescer sem controle financeiro pode gerar estagnação."}
                        </p>
                      </div>

                      {/* Mini oferta complementar */}
                      <div className="text-center">
                        <div className="inline-block bg-card rounded-lg px-6 py-4 border-2 border-border mb-6">
                          <p className="font-semibold text-foreground">
                            {perfilSecundario === 'sobrecarga' && "Módulo de Organização Operacional"}
                            {perfilSecundario === 'gestao' && "Treinamento de Planejamento e Metas"}
                            {perfilSecundario === 'conversao' && "Ajuste de Posicionamento e Funil"}
                            {perfilSecundario === 'financeiro' && "Estrutura de Previsibilidade Financeira"}
                          </p>
                        </div>
                      </div>

                      {/* Botão do upsell (mais discreto) */}
                      <div className="text-center">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={async () => {
                            // Criar tag do upsell
                            const tagUpsell = `Upsell_${perfilSecundario.charAt(0).toUpperCase() + perfilSecundario.slice(1)}`

                            // Log da tag (pode ser salvo no lead posteriormente)
                            console.log('Tag do upsell:', tagUpsell)

                            // Aqui você pode adicionar redirecionamento específico para o upsell
                            // window.location.href = '/upsell-' + perfilSecundario
                          }}
                          className="text-base font-semibold px-10 py-6 border-2 hover:bg-accent"
                        >
                          {perfilSecundario === 'sobrecarga' && "Quero ajustar minha estrutura interna"}
                          {perfilSecundario === 'gestao' && "Quero estruturar minha direção"}
                          {perfilSecundario === 'conversao' && "Quero melhorar minha conversão"}
                          {perfilSecundario === 'financeiro' && "Quero organizar meu crescimento financeiro"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 py-6 relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-100/75 to-purple-200/55">
      {/* Fundo premium com efeitos sutis */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
        backgroundImage: `
          radial-gradient(ellipse at 30% 40%, rgba(168, 85, 247, 0.23) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 60%, rgba(192, 132, 252, 0.18) 0%, transparent 50%)
        `,
      }}></div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Barra de Progresso Premium */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-purple-800">
              Pergunta {currentQuestion + 1} de {quizQuestions.length}
            </p>
            <p className="text-xs font-bold text-purple-900">
              {Math.round(progress)}%
            </p>
          </div>
          <div className="relative h-2 bg-white/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 transition-all duration-500 ease-out rounded-full shadow-lg"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Card da Pergunta Premium */}
        <Card className="border-2 border-purple-200/80 shadow-2xl backdrop-blur-sm bg-white/95 rounded-2xl overflow-hidden animate-fadeIn">
          <CardContent className="p-5 md:p-6">
            {/* Pergunta com animação de digitação */}
            <div className="mb-5 animate-typeIn">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
                {currentQ.question}
              </h2>
            </div>

            {/* Opções Redesenhadas */}
            <RadioGroup
              value={selectedAnswer?.toString() || ''}
              onValueChange={(value) => setSelectedAnswer(parseInt(value))}
              className="space-y-2 animate-fadeInUp"
            >
              {currentQ.options.map((option, index) => (
                <div
                  key={index}
                  className={`relative flex items-start space-x-3 p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                    selectedAnswer === index
                      ? 'border-purple-600 bg-gradient-to-r from-purple-50 to-purple-100/80 shadow-lg scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:scale-[1.01]'
                  }`}
                  onClick={() => setSelectedAnswer(index)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    className="mt-0.5 w-4 h-4 border-2 flex-shrink-0"
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className={`text-sm md:text-base leading-snug cursor-pointer flex-1 transition-colors ${
                      selectedAnswer === index
                        ? 'text-purple-900 font-semibold'
                        : 'text-gray-700 group-hover:text-gray-900'
                    }`}
                  >
                    {option.text}
                  </Label>
                  {selectedAnswer === index && (
                    <div className="absolute -right-1 -top-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center shadow-lg animate-scaleIn flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>

            {/* Botão Premium com Mais Presença */}
            <div className="mt-5">
              <Button
                onClick={handleNext}
                disabled={selectedAnswer === null}
                className="w-full h-12 text-base font-bold bg-gradient-to-br from-purple-700 via-purple-600 to-purple-500 hover:from-purple-800 hover:via-purple-700 hover:to-purple-600 text-white rounded-xl shadow-[0_6px_20px_rgba(126,34,206,0.35)] hover:shadow-[0_8px_28px_rgba(126,34,206,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                size="lg"
              >
                {isLastQuestion ? 'Finalizar Quiz' : 'Próxima Pergunta'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estilos de animação */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-typeIn {
          animation: typeIn 0.7s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f0f', color: '#fff' }}>Carregando...</div>}>
      <QuizContent />
    </Suspense>
  )
}
