'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Check, 
  Users, 
  Zap, 
  TrendingUp, 
  Shield, 
  Award,
  ChevronRight,
  Play,
  Star,
  Wallet,
  Network,
  Crown,
  Target,
  Gift
} from 'lucide-react'

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-950/95 backdrop-blur-xl border-b border-white/10' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/assets/logo.png" 
              alt="3Blex Logo" 
              width={48} 
              height={48} 
              className="rounded-xl shadow-lg shadow-violet-500/30"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              3Blex
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#come-funziona" className="text-sm text-white/70 hover:text-white transition-colors">Come Funziona</a>
            <a href="#commissioni" className="text-sm text-white/70 hover:text-white transition-colors">Commissioni</a>
            <a href="#rank" className="text-sm text-white/70 hover:text-white transition-colors">Rank</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">
              Accedi
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
            >
              Inizia Ora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/50 via-slate-950 to-slate-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-l from-blue-600/20 to-transparent rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full mb-8 border border-white/10">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-white/80">Sistema Binary MLM Professionale</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                Costruisci il Tuo 
                <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  Network Empire
                </span>
              </h1>

              <p className="text-xl text-white/60 mb-10 leading-relaxed max-w-xl">
                La piattaforma di network marketing più avanzata d'Italia. 
                Sistema binario puro, commissioni automatiche, crescita illimitata.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link 
                  href="/register"
                  className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-violet-500/30 transition-all"
                >
                  Inizia Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#come-funziona"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Come Funziona
                </a>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8">
                <div>
                  <div className="text-3xl font-bold text-white">€2.5M+</div>
                  <div className="text-sm text-white/50">Commissioni Pagate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">10K+</div>
                  <div className="text-sm text-white/50">Affiliati Attivi</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">99.9%</div>
                  <div className="text-sm text-white/50">Uptime</div>
                </div>
              </div>
            </motion.div>

            {/* Binary Tree Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-xl" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  {/* Tree visualization */}
                  <div className="flex flex-col items-center">
                    {/* Root */}
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30 mb-2">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-sm text-white/60 mb-6">TU</span>
                    
                    {/* Connectors */}
                    <div className="w-0.5 h-8 bg-gradient-to-b from-violet-500 to-transparent" />
                    <div className="w-64 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
                    
                    {/* Left and Right */}
                    <div className="flex gap-32 mt-2">
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-8 bg-blue-500" />
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-xs text-blue-400 mt-2">Sinistra</span>
                        <span className="text-sm font-semibold text-white mt-1">€45,000</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-8 bg-purple-500" />
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-xs text-purple-400 mt-2">Destra</span>
                        <span className="text-sm font-semibold text-white mt-1">€38,500</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Commission Box */}
                  <div className="mt-8 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-400">Commissione Settimanale</span>
                      <span className="text-2xl font-bold text-green-400">+€3,850</span>
                    </div>
                    <div className="text-xs text-white/50 mt-1">10% sulla gamba debole</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="come-funziona" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-sm text-violet-400 font-semibold tracking-wider uppercase mb-4 block">
              Come Funziona
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Sistema Binario <span className="text-violet-400">Semplice e Potente</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Due gambe, guadagni illimitati. Il nostro sistema binario puro 
              massimizza i tuoi profitti con spillover automatico.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Struttura a 2 Gambe',
                description: 'Costruisci due linee (sinistra e destra). Ogni affiliato che registri va in una delle due gambe.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Zap,
                title: 'Spillover Automatico',
                description: 'Se le tue posizioni sono piene, i nuovi affiliati vengono posizionati automaticamente nella prima posizione libera.',
                color: 'from-violet-500 to-fuchsia-500',
              },
              {
                icon: TrendingUp,
                title: 'Commissione 10%',
                description: 'Guadagni il 10% del volume della gamba più debole. Calcolo settimanale, pagamento automatico.',
                color: 'from-green-500 to-emerald-500',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="h-full bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Commissions Section */}
      <section id="commissioni" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-sm text-fuchsia-400 font-semibold tracking-wider uppercase mb-4 block">
              Piano Compensi
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Guadagna in <span className="text-fuchsia-400">4 Modi Diversi</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: 'Diretta', percentage: '20%', desc: 'Sul primo acquisto dei tuoi diretti', color: 'violet' },
              { icon: Network, title: 'Binaria', percentage: '10%', desc: 'Sul volume della gamba debole', color: 'blue' },
              { icon: Users, title: 'Multilevel', percentage: '1-10%', desc: 'Su 10 livelli di profondità', color: 'fuchsia' },
              { icon: Crown, title: 'Rank Bonus', percentage: '€100-15K', desc: 'Bonus una tantum per rank', color: 'amber' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                  <div className={`w-12 h-12 bg-${item.color}-500/20 rounded-xl flex items-center justify-center mb-4`}>
                    <item.icon className={`w-6 h-6 text-${item.color}-400`} />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{item.percentage}</div>
                  <div className="font-semibold text-white mb-2">{item.title}</div>
                  <div className="text-sm text-white/50">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ranks Section */}
      <section id="rank" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm text-amber-400 font-semibold tracking-wider uppercase mb-4 block">
              Sistema Rank
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Scala i <span className="text-amber-400">Rank</span> e Guadagna di Più
            </h2>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Bronze', bonus: '€100', color: 'from-orange-600 to-amber-600' },
              { name: 'Silver', bonus: '€500', color: 'from-slate-400 to-slate-500' },
              { name: 'Gold', bonus: '€1,500', color: 'from-amber-400 to-yellow-500' },
              { name: 'Platinum', bonus: '€5,000', color: 'from-cyan-400 to-teal-500' },
              { name: 'Diamond', bonus: '€15,000', color: 'from-violet-400 to-purple-500' },
            ].map((rank, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className={`w-24 h-24 bg-gradient-to-br ${rank.color} rounded-2xl flex items-center justify-center shadow-xl mb-3 mx-auto`}>
                  <Award className="w-12 h-12 text-white" />
                </div>
                <div className="font-bold text-white">{rank.name}</div>
                <div className="text-sm text-white/50">Bonus: {rank.bonus}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-violet-950/50 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-pink-600/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Pronto a Iniziare?
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Unisciti a migliaia di affiliati che stanno costruendo 
              il loro futuro con 3Blex Network.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/register"
                className="group flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-violet-500/30 transition-all"
              >
                Crea Account Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/login"
                className="flex items-center justify-center gap-3 px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Accedi
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-white/50 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Registrazione Gratuita
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Nessuna Carta Richiesta
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Supporto 24/7
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image 
                src="/assets/logo.png" 
                alt="3Blex Logo" 
                width={40} 
                height={40} 
                className="rounded-xl shadow-lg"
              />
              <span className="text-xl font-bold">3Blex Network</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
              <Link href="/login" className="hover:text-white transition-colors">Accedi</Link>
              <Link href="/register" className="hover:text-white transition-colors">Registrati</Link>
              <Link href="/support" className="hover:text-white transition-colors">Supporto</Link>
            </div>
            
            <div className="text-sm text-white/30">
              © 2025 3Blex. Tutti i diritti riservati.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
