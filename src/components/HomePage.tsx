import React from 'react';
import { motion } from 'motion/react';

interface HomePageProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}

export function HomePage({ onNavigateToAuth }: HomePageProps) {
  return (
    <div className="page-shell min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="onboarding-image-placeholder" aria-hidden />

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center max-w-md mx-auto w-full">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-4"
          >
            Take control of your health
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-base text-brand-text-muted leading-relaxed mb-10"
          >
            Access clinical records, manage appointments, medications, trackers, and a whole lot more
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            onClick={() => onNavigateToAuth(undefined, 'sign-up')}
            className="app-button-primary w-full max-w-sm"
          >
            Get started
          </motion.button>

          <button
            onClick={() => onNavigateToAuth(undefined, 'sign-in')}
            className="mt-5 text-sm text-brand-text-muted"
          >
            I already have an account
          </button>
        </div>
      </div>
    </div>
  );
}
