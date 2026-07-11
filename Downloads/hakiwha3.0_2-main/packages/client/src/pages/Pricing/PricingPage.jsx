import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const PLANS = [
  {
    id: 'ESSENTIAL',
    name: 'Essential',
    price: 9.99,
    description: 'Access your marketing data and insights',
    features: [
      'Campaign dashboard & analytics',
      'Campaign performance tracking',
      'Asset intelligence & scoring',
      'Marketing memory & lessons',
      'Organization management',
      'Basic support',
    ],
    notIncluded: [
      'AI-powered campaign advisor',
      'AI chat assistant',
      'Smart recommendations',
      'AI-generated insights',
    ],
    color: 'teal',
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 19.99,
    description: 'Everything in Essential + AI-powered intelligence',
    features: [
      'Everything in Essential',
      'AI campaign advisor',
      'AI chat assistant (24/7)',
      'Smart asset recommendations',
      'AI-generated performance insights',
      'Predictive campaign analysis',
      'Priority support',
    ],
    notIncluded: [],
    color: 'cyan',
    popular: true,
  },
];

export default function PricingPage() {
  const { user, isPremium, refreshPlan } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [success, setSuccess] = useState(false);

  const upgradeMutation = useMutation({
    mutationFn: async (plan) => {
      const { data } = await api.post('/subscription/upgrade', { plan });
      return data;
    },
    onSuccess: async () => {
      await refreshPlan();
      setSuccess(true);
      setUpgrading(false);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: () => {
      setUpgrading(false);
    },
  });

  const handleUpgrade = (planId) => {
    setUpgrading(true);
    upgradeMutation.mutate(planId);
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Choose Your Plan</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Start with Essential, upgrade to Premium for AI-powered insights
        </p>
        {isPremium && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
              You're currently on the Premium plan
            </span>
          </div>
        )}
        {success && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Plan updated successfully!
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = (plan.id === 'PREMIUM' && isPremium) || (plan.id === 'ESSENTIAL' && !isPremium);
          const canUpgrade = plan.id === 'PREMIUM' && !isPremium;

          return (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 ${
                plan.popular
                  ? 'border-teal-500 dark:border-teal-500/50 shadow-lg shadow-teal-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              } ${isCurrentPlan ? 'ring-2 ring-teal-500/30' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{plan.description}</p>

                <div className="mt-6 mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">${plan.price}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <svg className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm opacity-50">
                      <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-slate-500 dark:text-slate-500">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div className="w-full py-3 rounded-xl text-center text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    Current Plan
                  </div>
                ) : canUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading ? 'Upgrading...' : `Upgrade to ${plan.name}`}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading || isPremium}
                    className="w-full py-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Downgrade
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          All plans include a 14-day free trial. No credit card required.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Questions? Contact us at support@admind.dev
        </p>
      </div>
    </div>
  );
}
