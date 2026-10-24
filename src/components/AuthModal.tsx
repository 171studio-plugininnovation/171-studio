import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { MASTER_EMAIL } from '../types/cms';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authPromptReason, login, loginWithGoogle, register } = useStudio();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim()) {
          setError('Inserisci il tuo indirizzo email');
          setIsLoading(false);
          return;
        }
        await login(email.trim(), name.trim() || undefined, password);
      } else {
        if (!name.trim() || !email.trim()) {
          setError('Inserisci nome ed indirizzo email per registrarti');
          setIsLoading(false);
          return;
        }
        await register(email.trim(), name.trim(), password);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Si è verificato un errore durante l\'autenticazione');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Accesso Google non riuscito. Puoi creare il tuo account inserendo nome ed email qui sopra in 1 click.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-amber-500/40 shadow-2xl shadow-black/90 text-white"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Chiudi finestra"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg">
            <Lock className="w-6 h-6" />
          </div>

          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 block mb-1">
            PORTALE UTENTI 171 STUDIO
          </span>

          <h2 className="text-2xl font-heading font-black text-white">
            {mode === 'login' ? 'Accedi al tuo Account' : 'Crea il tuo Account'}
          </h2>

          {authPromptReason && (
            <p className="mt-2 text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 font-mono">
              {authPromptReason}
            </p>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-neutral-900 p-1 mb-5 border border-neutral-800">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
              mode === 'login' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
              mode === 'register' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Registrati
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                Nome & Cognome / Nome d'Arte
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Es. Marco Rossi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-amber-400 text-sm text-white outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
              Indirizzo Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="nome@esempio.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-amber-400 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-amber-400 text-sm text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{mode === 'login' ? 'Entra nel Portale' : 'Completa Registrazione'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Google Sign In option */}
        <div className="mt-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Accedi con Account Google</span>
          </button>
        </div>

        {/* Security Notice for Studio Master */}
        <div className="mt-6 pt-4 border-t border-neutral-900 text-center">
          <p className="text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Pannello Master riservato a <strong className="text-white">{MASTER_EMAIL}</strong></span>
          </p>
          <p className="text-[10px] font-mono text-neutral-500 mt-1">
            Per accedere come Amministratore Studio usa il pulsante <strong>"Accedi con Account Google"</strong> con l'account ufficiale dello studio.
          </p>
        </div>

      </div>
    </div>
  );
};
