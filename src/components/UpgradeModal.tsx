'use client';

import { X, Check, Zap, Infinity } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: 'monthly' | 'yearly') => void;
}

export default function UpgradeModal({ isOpen, onClose, onUpgrade }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-modern animate-scale-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Upgrade para Premium</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6 mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-500 via-slate-500 to-gray-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-r from-gray-500 to-slate-600 text-white p-6 rounded-2xl shadow-glow-accent">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Zap className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold">ReciclaApp Premium</h3>
                </div>
                <p className="text-gray-100 text-sm font-medium">
                  Análises ilimitadas e recursos avançados de IA
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 animate-slide-up">
                <div className="p-2 bg-gray-500/20 rounded-xl">
                  <Check className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-white font-medium">Análises ilimitadas por dia</span>
              </div>
              <div className="flex items-center space-x-4 animate-slide-up delay-100">
                <div className="p-2 bg-slate-500/20 rounded-xl">
                  <Check className="h-5 w-5 text-slate-400" />
                </div>
                <span className="text-white font-medium">Banco de dados especializado</span>
              </div>
              <div className="flex items-center space-x-4 animate-slide-up delay-200">
                <div className="p-2 bg-gray-400/20 rounded-xl">
                  <Check className="h-5 w-5 text-gray-300" />
                </div>
                <span className="text-white font-medium">Histórico de análises</span>
              </div>
              <div className="flex items-center space-x-4 animate-slide-up delay-300">
                <div className="p-2 bg-slate-400/20 rounded-xl">
                  <Check className="h-5 w-5 text-slate-300" />
                </div>
                <span className="text-white font-medium">Conexão com instituições</span>
              </div>
              <div className="flex items-center space-x-4 animate-slide-up delay-400">
                <div className="p-2 bg-gray-300/20 rounded-xl">
                  <Check className="h-5 w-5 text-gray-200" />
                </div>
                <span className="text-white font-medium">Suporte prioritário</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => onUpgrade('monthly')}
              className="w-full glass-card text-white py-5 px-6 rounded-2xl flex items-center justify-between hover:opacity-80 transition-all duration-200 shadow-modern hover:shadow-glow border border-white/20 group cursor-pointer"
            >
              <div className="text-left">
                <div className="font-bold text-lg">Plano Mensal</div>
                <div className="text-sm text-white">R$ 9,90/mês</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                  <Infinity className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">Ilimitado</span>
              </div>
            </button>

            <button
              onClick={() => onUpgrade('yearly')}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-700 text-white py-5 px-6 rounded-2xl flex items-center justify-between hover:opacity-80 transition-all duration-200 shadow-glow-accent hover:shadow-glow-secondary relative group cursor-pointer"
            >
              <div className="absolute -top-3 left-4 bg-gradient-to-r from-gray-400 to-slate-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                Mais Popular
              </div>
              <div className="text-left">
                <div className="font-bold text-lg">Plano Anual</div>
                <div className="text-sm text-white">R$ 99,90/ano</div>
                <div className="text-xs text-white font-medium">Economia de 16%</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                  <Infinity className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">Ilimitado</span>
              </div>
            </button>
          </div>

          <div className="mt-8 glass-card p-4 rounded-2xl border border-white/20">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <p className="text-xs text-white font-medium">
                Cancele a qualquer momento. Pagamento seguro processado pela Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

