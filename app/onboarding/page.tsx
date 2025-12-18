'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  ChevronRight, 
  ChevronLeft,
  Check,
  Users,
  Wallet,
  TrendingUp,
  Shield,
  Gift,
  Zap,
  Award,
  ArrowRight
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'

interface OnboardingStep {
  id: number
  title: string
  subtitle: string
  icon: any
  content: React.ReactNode
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const response = await apiGet('/api/auth/me')
      if (response.user) {
        setUserData(response.user)
        // Se l'utente ha già completato l'onboarding, vai alla dashboard
        if (response.user.onboardingCompleted) {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      router.push('/login')
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    try {
      await apiPost('/api/user/complete-onboarding', {})
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      router.push('/dashboard')
    }
  }

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: 'Benvenuto in 3Blex! 🎉',
      subtitle: 'La tua piattaforma di Network Marketing',
      icon: Gift,
      content: (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-32 h-32 mx-auto mb-8"
          >
            <Image 
              src="/assets/logo.png" 
              alt="3Blex Logo" 
              width={128} 
              height={128} 
              className="rounded-3xl shadow-2xl shadow-brand-500/30"
            />
          </motion.div>
          <p className="text-slate-600 max-w-md mx-auto">
            Scopri come costruire il tuo business con il sistema binario più avanzato. 
            Ti guideremo passo passo verso il successo.
          </p>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Sistema Binario',
      subtitle: 'Due gambe, infinite possibilità',
      icon: Users,
      content: (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              {/* Tree visualization */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
              >
                TU
              </motion.div>
              <div className="flex justify-center mt-4 gap-16">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-0.5 h-8 bg-blue-300 mx-auto mb-2" />
                  <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-2">Sinistra</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className="w-0.5 h-8 bg-purple-300 mx-auto mb-2" />
                  <div className="w-16 h-16 bg-purple-100 border-2 border-purple-300 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-600 font-medium mt-2">Destra</p>
                </motion.div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 max-w-md mx-auto">
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                <span>Costruisci due gambe di affiliati</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                <span>Spillover automatico per bilanciare la struttura</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                <span>Guadagna in profondità illimitata</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Commissioni',
      subtitle: 'Più modi per guadagnare',
      icon: Wallet,
      content: (
        <div className="space-y-4 max-w-md mx-auto">
          <CommissionCard
            icon={Zap}
            title="Commissione Diretta"
            percentage="20%"
            description="Sul primo acquisto dei tuoi affiliati diretti"
            color="accent"
            delay={0.1}
          />
          <CommissionCard
            icon={TrendingUp}
            title="Commissione Binaria"
            percentage="10%"
            description="Sul volume della gamba più debole (settimanale)"
            color="brand"
            delay={0.2}
          />
          <CommissionCard
            icon={Award}
            title="Commissione Multilevel"
            percentage="fino a 10%"
            description="Su 10 livelli di profondità sponsor"
            color="purple"
            delay={0.3}
          />
        </div>
      ),
    },
    {
      id: 3,
      title: 'Rank & Qualifiche',
      subtitle: 'Cresci e sblocca bonus',
      icon: Award,
      content: (
        <div className="space-y-4 max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <RankCard rank="BRONZE" bonus="€100" delay={0.1} />
            <RankCard rank="SILVER" bonus="€500" delay={0.15} />
            <RankCard rank="GOLD" bonus="€1,500" delay={0.2} />
            <RankCard rank="PLATINUM" bonus="€5,000" delay={0.25} />
            <RankCard rank="DIAMOND" bonus="€15,000" delay={0.3} className="col-span-2" />
          </div>
          <p className="text-center text-sm text-slate-500">
            Più sali di rank, più guadagni con bonus e pool leadership
          </p>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Verifica KYC',
      subtitle: 'Proteggi i tuoi guadagni',
      icon: Shield,
      content: (
        <div className="text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 mx-auto mb-6 bg-accent-100 rounded-full flex items-center justify-center"
          >
            <Shield className="w-12 h-12 text-accent-600" />
          </motion.div>
          <p className="text-slate-600 mb-6">
            Per prelevare le tue commissioni, dovrai completare la verifica KYC 
            (Know Your Customer). È semplice e veloce!
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left">
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">1</span>
                <span>Carica un documento d'identità valido</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">2</span>
                <span>Scatta un selfie di verifica</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">3</span>
                <span>Conferma il tuo indirizzo</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Sei Pronto! 🚀',
      subtitle: 'Inizia la tua avventura',
      icon: Zap,
      content: (
        <div className="text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center shadow-2xl shadow-accent-500/30"
          >
            <Check className="w-16 h-16 text-white" />
          </motion.div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Hai completato l'introduzione!
          </h3>
          <p className="text-slate-600 mb-8">
            Ora puoi iniziare a costruire il tuo network. 
            Ricorda: il tuo successo dipende dalla tua costanza e impegno.
          </p>
          <div className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl p-4 border border-brand-100">
            <p className="text-sm text-brand-800 font-medium">
              💡 Consiglio: Inizia condividendo il tuo link referral con amici e conoscenti!
            </p>
          </div>
        </div>
      ),
    },
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-200">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2 pt-6 px-4">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentStep
                ? 'bg-brand-500 w-8'
                : index < currentStep
                ? 'bg-brand-300'
                : 'bg-slate-300'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex p-3 bg-brand-100 rounded-2xl mb-4"
              >
                <currentStepData.icon className="w-8 h-8 text-brand-600" />
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                {currentStepData.title}
              </h1>
              <p className="text-slate-500">{currentStepData.subtitle}</p>
            </div>

            {/* Step Content */}
            {currentStepData.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-6 bg-white border-t border-slate-200">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
              isFirstStep
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Indietro
          </button>

          {isLastStep ? (
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/25"
            >
              {loading ? 'Caricamento...' : 'Inizia'}
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
            >
              Continua
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {!isLastStep && (
          <button
            onClick={completeOnboarding}
            className="block mx-auto mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Salta introduzione
          </button>
        )}
      </div>
    </div>
  )
}

function CommissionCard({
  icon: Icon,
  title,
  percentage,
  description,
  color,
  delay,
}: {
  icon: any
  title: string
  percentage: string
  description: string
  color: 'accent' | 'brand' | 'purple'
  delay: number
}) {
  const colorClasses = {
    accent: 'bg-accent-50 border-accent-200',
    brand: 'bg-brand-50 border-brand-200',
    purple: 'bg-purple-50 border-purple-200',
  }

  const iconClasses = {
    accent: 'bg-accent-500 text-white',
    brand: 'bg-brand-500 text-white',
    purple: 'bg-purple-500 text-white',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-4 p-4 rounded-xl border ${colorClasses[color]}`}
    >
      <div className={`p-3 rounded-xl ${iconClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold text-slate-900">{title}</p>
          <span className="text-lg font-bold text-brand-600">{percentage}</span>
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </motion.div>
  )
}

function RankCard({ 
  rank, 
  bonus, 
  delay, 
  className = '' 
}: { 
  rank: string
  bonus: string
  delay: number
  className?: string
}) {
  const rankColors: Record<string, string> = {
    BRONZE: 'from-orange-400 to-amber-500',
    SILVER: 'from-slate-400 to-gray-500',
    GOLD: 'from-amber-400 to-yellow-500',
    PLATINUM: 'from-cyan-400 to-teal-500',
    DIAMOND: 'from-violet-400 to-purple-500',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${rankColors[rank]} p-4 rounded-xl text-white ${className}`}
    >
      <p className="font-bold">{rank}</p>
      <p className="text-2xl font-bold">{bonus}</p>
      <p className="text-xs opacity-80">Bonus una tantum</p>
    </motion.div>
  )
}
