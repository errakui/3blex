'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { apiUrl } from '@/lib/api'
import { 
  TrendingUp, 
  Users,
  User,
  ShoppingBag, 
  Award, 
  Wallet, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Star,
  BarChart3,
  Globe,
  MessageSquare,
  Calendar,
  Gift,
  Target,
  DollarSign,
  PieChart,
  Network,
  Building2,
  Rocket,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  TrendingDown,
  Layers,
  CreditCard
} from 'lucide-react'

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  useEffect(() => {
    fetch(apiUrl('/api/products/public'))
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setProducts(data.products.slice(0, 6))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { value: '10K+', label: 'Affiliati Attivi' },
    { value: '€2.5M+', label: 'Commissioni Pagate' },
    { value: '50K+', label: 'Ordini Processati' },
    { value: '99.9%', label: 'Uptime Servizio' }
  ]

  const compensationPlan = [
    {
      type: 'Commissione Diretta',
      percentage: '20%',
      description: 'Su ogni nuovo affiliato che si registra con il tuo link',
      icon: User,
      color: 'from-primary to-primary-dark'
    },
    {
      type: 'Commissione Binaria',
      percentage: '10%',
      description: 'Sul volume della gamba più debole del tuo network',
      icon: PieChart,
      color: 'from-blue-500 to-blue-700'
    },
    {
      type: 'Bonus Qualifica',
      percentage: 'Variabile',
      description: 'Bonus progressivi in base al tuo rank e qualifica',
      icon: Award,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      type: 'Commissione Multilevel',
      percentage: '5-15%',
      description: 'Commissioni ricorrenti su più livelli del tuo network',
      icon: Network,
      color: 'from-green-500 to-emerald-600'
    }
  ]

  const ranks = [
    { name: 'Bronze', pv: '0', gv: '0', bonus: '0€', color: 'bg-amber-100 text-amber-700' },
    { name: 'Silver', pv: '500', gv: '2.000', bonus: '100€', color: 'bg-gray-100 text-gray-700' },
    { name: 'Gold', pv: '1.000', gv: '5.000', bonus: '300€', color: 'bg-yellow-100 text-yellow-700' },
    { name: 'Platinum', pv: '2.500', gv: '15.000', bonus: '750€', color: 'bg-blue-100 text-blue-700' },
    { name: 'Diamond', pv: '5.000', gv: '50.000', bonus: '2.000€', color: 'bg-purple-100 text-purple-700' }
  ]

  const faqs = [
    {
      question: 'Come funziona la struttura binaria?',
      answer: 'La struttura binaria divide il tuo network in due gambe (sinistra e destra). Guadagni commissioni sul volume della gamba più debole, incentivando uno sviluppo equilibrato. Puoi posizionare nuovi affiliati automaticamente o manualmente per ottimizzare il guadagno.'
    },
    {
      question: 'Quanto posso guadagnare?',
      answer: 'I guadagni dipendono dalla tua attività e dal volume del network. Con il nostro sistema ibrido puoi guadagnare da commissioni dirette (20%), commissioni binarie (10% sul volume debole), bonus qualifica e commissioni multilevel. Non ci sono limiti superiori ai guadagni!'
    },
    {
      question: 'Come vengono pagate le commissioni?',
      answer: 'Le commissioni vengono calcolate automaticamente e accreditPublished on your wallet interno. Puoi prelevare quando vuoi tramite bonifico bancario. Le commissioni iniziano come "pending" e diventano "available" dopo l\'approvazione KYC.'
    },
    {
      question: 'Cosa serve per iniziare?',
      answer: 'Registrazione gratuita, completamento KYC (documento d\'identità, selfie, proof of address) e attivazione di un piano di abbonamento (mensile €29.99 o annuale €299.99 con sconto del 17%).'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-border-light z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/logo.png"
              alt="3Blex Logo"
              width={120}
              height={120}
              className="rounded-lg"
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/customer">
              <Button variant="outline" size="sm">🛒 Marketplace</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-primary hover:bg-primary/90">🚀 Diventa Affiliato</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="sm">Accedi</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Funnel Step 1 */}
      <section className="pt-40 pb-20 px-6 bg-gradient-to-br from-primary/15 via-background to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/20 rounded-full mb-8 border border-primary/30">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <span className="text-base font-semibold text-primary">Piattaforma #1 per Network Marketing</span>
              <Star className="w-5 h-5 text-primary fill-primary" />
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-text-primary mb-6 leading-tight">
              Costruisci il Tuo
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">
                Network Marketing
              </span>
              <br />
              <span className="text-4xl md:text-5xl">e Guadagna con 3Blex</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-3xl mx-auto leading-relaxed">
              Unisciti a migliaia di affiliati che stanno costruendo <strong>indipendenza finanziaria</strong> con il nostro sistema 
              di network marketing avanzato, <strong>struttura binaria intelligente</strong> e marketplace integrato.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-12">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                  🚀 Inizia Gratis Subito
                  <ArrowRight className="ml-2" size={22} />
                </Button>
              </Link>
              <Link href="/subscription">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 border-2">
                  💎 Vedi Piani di Abbonamento
                  <ArrowRight className="ml-2" size={22} />
                </Button>
              </Link>
            </div>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-border-light shadow-soft">
                  <div className="text-3xl md:text-4xl font-extrabold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm font-medium text-text-secondary">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Il Progetto - Chi Siamo */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Il Progetto</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6">
              Cos'è 3Blex?
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              3Blex è la <strong>piattaforma all-in-one</strong> che unisce network marketing professionale 
              e e-commerce in un unico sistema integrato. Progettata per aiutare gli affiliati a costruire 
              un business sostenibile e redditizio.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Network className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Network Marketing Avanzato</h3>
              <p className="text-text-secondary">
                Sistema binario e multilevel ibrido per massimizzare i guadagni. Struttura intelligente 
                che si adatta al tuo stile di crescita.
              </p>
            </div>
            
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Marketplace Integrato</h3>
              <p className="text-text-secondary">
                Catalogo prodotti completo con prezzi differenziati. Vendita diretta e commissioni 
                su ogni transazione del tuo network.
              </p>
            </div>
            
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Automazione Completa</h3>
              <p className="text-text-secondary">
                Calcolo automatico commissioni, distribuzione wallet, tracking ordini. Tutto automatizzato 
                per lasciarti concentrare sulla crescita.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Inizia a Costruire il Tuo Network
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Struttura Binaria - Spiegazione Grafica */}
      <section className="py-20 px-6 bg-gradient-to-br from-background-subtle via-background to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <Network className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">Struttura Binaria</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6">
              Come Funziona la Struttura Binaria
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Sistema innovativo che divide il tuo network in <strong>due gambe</strong> (sinistra e destra) 
              per massimizzare i guadagni attraverso uno sviluppo equilibrato.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            {/* Diagramma Binario */}
            <div className="bg-white rounded-2xl p-8 shadow-large border border-border-light">
              <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">Visualizzazione Struttura</h3>
              <div className="relative">
                {/* Tu (Centro) */}
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
                    <User className="text-white" size={40} />
                  </div>
                </div>
                
                {/* Linee */}
                <div className="flex justify-around mb-6">
                  <div className="w-1 h-12 bg-primary mx-auto"></div>
                </div>
                
                {/* Due Gambe */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-text-primary mb-3">Gamba Sinistra</div>
                    <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                      <div className="flex flex-col gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto flex items-center justify-center">
                          <User className="text-white" size={24} />
                        </div>
                        <div className="text-xs text-blue-700 font-medium">Volume: €1.000</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-semibold text-text-primary mb-3">Gamba Destra</div>
                    <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                      <div className="flex flex-col gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto flex items-center justify-center">
                          <User className="text-white" size={24} />
                        </div>
                        <div className="text-xs text-green-700 font-medium">Volume: €800</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Commissione */}
                <div className="mt-8 text-center p-6 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="text-sm text-text-secondary mb-2">Commissione Binaria</div>
                  <div className="text-3xl font-extrabold text-primary">10%</div>
                  <div className="text-sm text-text-secondary mt-2">sul volume più debole: <strong>€800</strong></div>
                  <div className="text-lg font-bold text-primary mt-3">= €80 commissione</div>
                </div>
              </div>
            </div>

            {/* Spiegazione */}
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">Sviluppo Equilibrato</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      La struttura binaria incentiva lo sviluppo di entrambe le gambe. Più crescono in modo bilanciato, 
                      maggiore è il tuo potenziale di guadagno.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PieChart className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">Calcolo Automatico</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      Il sistema calcola automaticamente il volume di ogni gamba e ti accredita il 10% 
                      sul volume della gamba più debole ogni settimana/mese.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">Crescita Illimitata</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      Non ci sono limiti al numero di livelli o alla profondità del network. 
                      Più cresce il tuo network, più guadagni.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/register">
                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
                    Inizia a Costruire la Tua Struttura
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Piano Compensi Dettagliato */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full mb-6">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-600">Piano Compensi</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6">
              Come Guadagni con 3Blex
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Sistema di compensi <strong>multi-sfaccettato</strong> che ti permette di guadagnare in diversi modi. 
              Più attività sviluppi, più fonti di reddito hai.
            </p>
          </div>

          {/* Tipi di Commissione */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {compensationPlan.map((comp, idx) => {
              const Icon = comp.icon
              return (
                <div key={idx} className="card p-8 hover:shadow-large transition-all border-2 border-transparent hover:border-primary/20">
                  <div className={`w-16 h-16 bg-gradient-to-br ${comp.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon className="text-white" size={32} />
                  </div>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-4xl font-extrabold text-primary">{comp.percentage}</span>
                    <span className="text-lg font-semibold text-text-primary">{comp.type}</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed mb-6">{comp.description}</p>
                  <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                    <CheckCircle size={16} />
                    <span>Calcolo Automatico</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Esempio Pratico */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 mb-16 border border-primary/20">
            <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">Esempio Pratico di Guadagno</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="text-sm text-text-secondary mb-2">Nuovi Affiliati</div>
                <div className="text-3xl font-extrabold text-primary mb-2">5</div>
                <div className="text-sm text-text-secondary">× €29.99/mese</div>
                <div className="mt-4 pt-4 border-t border-border-light">
                  <div className="text-xs text-text-secondary">Commissione 20%</div>
                  <div className="text-xl font-bold text-green-600">+ €29.99/mese</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="text-sm text-text-secondary mb-2">Volume Binario</div>
                <div className="text-3xl font-extrabold text-primary mb-2">€2.000</div>
                <div className="text-sm text-text-secondary">gamba debole</div>
                <div className="mt-4 pt-4 border-t border-border-light">
                  <div className="text-xs text-text-secondary">Commissione 10%</div>
                  <div className="text-xl font-bold text-green-600">+ €200</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-center text-white">
                <div className="text-sm text-white/80 mb-2">Guadagno Totale</div>
                <div className="text-4xl font-extrabold mb-2">€229.99</div>
                <div className="text-sm text-white/80">al mese</div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="text-xs text-white/60">Potenziale annuo</div>
                  <div className="text-xl font-bold">€2.759,88</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sistema Qualifiche */}
          <div className="mb-12">
            <h3 className="text-3xl font-bold text-text-primary mb-8 text-center">Sistema Qualifiche e Rank</h3>
            <div className="grid md:grid-cols-5 gap-4">
              {ranks.map((rank, idx) => (
                <div key={idx} className="card p-6 text-center hover:shadow-medium transition-all">
                  <div className={`inline-flex px-4 py-2 rounded-full mb-4 ${rank.color}`}>
                    <span className="font-bold text-sm">{rank.name}</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-text-secondary mb-1">PV Richiesto</div>
                      <div className="font-bold text-text-primary">{rank.pv}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary mb-1">GV Richiesto</div>
                      <div className="font-bold text-text-primary">{rank.gv}</div>
                    </div>
                    <div className="pt-3 border-t border-border-light">
                      <div className="text-text-secondary mb-1">Bonus Qualifica</div>
                      <div className="font-bold text-primary text-lg">{rank.bonus}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 px-10">
                Inizia a Guadagnare Ora
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Come Funziona - Step by Step */}
      <section className="py-20 px-6 bg-background-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Rocket className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Come Funziona</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6">
              Inizia in 3 Semplici Passi
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                step: '01',
                title: 'Registrati Gratis',
                description: 'Crea il tuo account in meno di 2 minuti. Nessuna carta di credito richiesta per la registrazione iniziale.',
                icon: User,
                action: 'Registrati Ora',
                link: '/register'
              },
              {
                step: '02',
                title: 'Attiva il Tuo Piano',
                description: 'Scegli tra piano mensile (€29.99) o annuale (€299.99 con sconto 17%). Completa il KYC e ottieni accesso completo.',
                icon: CreditCard,
                action: 'Vedi Piani',
                link: '/subscription'
              },
              {
                step: '03',
                title: 'Costruisci e Guadagna',
                description: 'Invita affiliati, sviluppa le tue gambe binaria, scala le qualifiche e guadagna commissioni automatiche.',
                icon: TrendingUp,
                action: 'Vedi Network',
                link: '/network'
              }
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="relative">
                  <div className="card p-8 h-full hover:shadow-large transition-all">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold">{item.step}</span>
                    </div>
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                      <Icon className="text-primary" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-4">{item.title}</h3>
                    <p className="text-text-secondary mb-6 leading-relaxed">{item.description}</p>
                    <Link href={item.link}>
                      <Button variant="outline" className="w-full">
                        {item.action}
                        <ArrowRight className="ml-2" size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Prodotti in Evidenza */}
      {products.length > 0 && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-text-primary mb-4">
                🛒 I Nostri Prodotti
              </h2>
              <p className="text-xl text-text-secondary">
                Scopri il marketplace integrato con prodotti premium
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {products.map((product) => (
                <Link key={product.id} href={`/customer/purchase/${product.id}`}>
                  <div className="card overflow-hidden hover:shadow-large transition-all group">
                    {product.image && (
                      <div className="w-full min-h-[280px] bg-background-subtle flex items-center justify-center overflow-hidden p-6">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={400}
                          height={400}
                          className="w-auto h-auto max-w-full max-h-[380px] object-contain group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-extrabold text-primary">
                          €{product.price?.toFixed(2)}
                        </span>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          Acquista
                          <ArrowRight className="ml-1" size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/customer">
                <Button size="lg" variant="outline" className="border-2">
                  Vedi Tutto il Catalogo
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-background-subtle">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Domande Frequenti
            </h2>
            <p className="text-text-secondary">Tutto quello che devi sapere su 3Blex</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-background-subtle transition-colors"
                >
                  <span className="text-lg font-semibold text-text-primary pr-8">{faq.question}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="text-primary flex-shrink-0" size={24} />
                  ) : (
                    <ChevronDown className="text-text-secondary flex-shrink-0" size={24} />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 pb-6 pt-0">
                    <div className="text-text-secondary leading-relaxed border-t border-border-light pt-6">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Finale - Upselling */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary via-primary to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Pronto a Trasformare la Tua Vita?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed">
            Unisciti a migliaia di affiliati che stanno già costruendo <strong>indipendenza finanziaria</strong>
          </p>
          <p className="text-lg text-white/80 mb-10">
            Inizia oggi e costruisci il tuo network marketing professionale
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-background-subtle text-lg px-10 py-6 shadow-xl">
                🚀 Registrati Gratis Ora
                <ArrowRight className="ml-2" size={22} />
              </Button>
            </Link>
            <Link href="/subscription">
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white/20 text-lg px-10 py-6">
                💎 Vedi Piani di Abbonamento
                <ArrowRight className="ml-2" size={22} />
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>Registrazione Gratuita</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>Nessun Costo Nascosto</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>Supporto 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border-light py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/assets/logo.png"
                  alt="3Blex Logo"
                  width={100}
                  height={100}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
              <p className="text-sm text-text-secondary mb-4">
                La piattaforma professionale per network marketing e e-commerce.
              </p>
              <div className="flex gap-3">
                <Link href="/register">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Inizia Gratis
                  </Button>
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Piattaforma</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Marketplace</Link></li>
                <li><Link href="/network" className="hover:text-primary transition-colors">Network</Link></li>
                <li><Link href="/qualifications" className="hover:text-primary transition-colors">Qualifiche</Link></li>
                <li><Link href="/events" className="hover:text-primary transition-colors">Eventi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Risorse</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="/support" className="hover:text-primary transition-colors">Supporto</Link></li>
                <li><Link href="/academy" className="hover:text-primary transition-colors">Accademia</Link></li>
                <li><Link href="/subscription" className="hover:text-primary transition-colors">Abbonamenti</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="/login" className="hover:text-primary transition-colors">Accedi</Link></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Registrati</Link></li>
                <li><Link href="/customer" className="hover:text-primary transition-colors">Marketplace Pubblico</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border-light text-center text-sm text-text-secondary">
            <p>&copy; 2025 3Blex. Tutti i diritti riservati. ERRAKUI.DEV WITH LOVE MADE IN ITALY/SWISS </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
