import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Mail, User, Shield, Sparkles, ArrowRight, KeyRound, 
  CheckCircle2, Clock, RotateCcw, AlertTriangle, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { MASTER_EMAIL } from '../types/cms';
import { StudioButton, StudioInput } from './ui';
import { validateEmailQuality } from '../utils/emailVerification';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authPromptReason, 
    login, 
    loginWithGoogle, 
    sendRegistrationVerificationOtp,
    verifyOtpAndCompleteRegistration,
    resendRegistrationVerificationOtp,
    cancelRegistrationVerification,
  } = useStudio();

  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resend cooldown timer (30 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    cancelRegistrationVerification();
    setError('');
    setInfoMessage('');
    setOtpCode('');
    setPreviewCode(null);
    setResendCooldown(0);
    closeAuthModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim()) {
          setError('Inserisci il tuo indirizzo email per accedere');
          setIsLoading(false);
          return;
        }
        await login(email.trim(), name.trim() || undefined, password);
      } else if (mode === 'register') {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || !cleanEmail) {
          setError('Inserisci sia il nome che l\'indirizzo email per registrarti');
          setIsLoading(false);
          return;
        }

        // Validate email against disposable/fake domains before proceeding
        const validation = validateEmailQuality(cleanEmail);
        if (!validation.isValid) {
          setError(validation.error || 'Indirizzo email non valido o temporaneo');
          setIsLoading(false);
          return;
        }

        // Send OTP verification code
        const res = await sendRegistrationVerificationOtp(cleanEmail, cleanName, password);
        setInfoMessage(res.message);
        if (res.previewCode) {
          setPreviewCode(res.previewCode);
        }
        setMode('verify');
        setResendCooldown(30);
      } else if (mode === 'verify') {
        const cleanOtp = otpCode.trim();
        if (!cleanOtp || cleanOtp.length !== 6) {
          setError('Inserisci il codice di sicurezza a 6 cifre ricevuto via email');
          setIsLoading(false);
          return;
        }

        await verifyOtpAndCompleteRegistration(email.trim().toLowerCase(), cleanOtp);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Si è verificato un errore durante l\'operazione');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setInfoMessage('');
    setIsLoading(true);

    try {
      const res = await resendRegistrationVerificationOtp(email.trim().toLowerCase());
      setInfoMessage(res.message);
      if (res.previewCode) {
        setPreviewCode(res.previewCode);
      }
      setResendCooldown(30);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Impossibile inviare un nuovo codice. Riprova tra poco.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRegister = () => {
    cancelRegistrationVerification();
    setMode('register');
    setOtpCode('');
    setPreviewCode(null);
    setError('');
    setInfoMessage('');
    setResendCooldown(0);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfoMessage('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-neutral-950/95 border border-amber-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] text-white overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Chassis Sheen Line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

        {/* Studio Hardware Rivets in corners */}
        <div className="absolute top-3 left-3 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 flex items-center justify-center">
          <div className="w-1 h-0.5 bg-neutral-500 rounded-full" />
        </div>
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 flex items-center justify-center">
          <div className="w-1 h-0.5 bg-neutral-500 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-900/90 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border border-neutral-800 cursor-pointer"
          aria-label="Chiudi finestra"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            {mode === 'verify' ? (
              <Mail className="w-6 h-6 animate-pulse" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>

          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 block mb-1">
            PORTALE UTENTI 171 STUDIO
          </span>

          <h2 className="text-2xl font-heading font-black text-white">
            {mode === 'login' && 'Accedi al tuo Account'}
            {mode === 'register' && 'Crea il tuo Account'}
            {mode === 'verify' && 'Verifica Indirizzo Email'}
          </h2>

          {mode === 'verify' && (
            <p className="mt-2 text-xs text-neutral-300 font-light">
              Abbiamo inviato un codice a 6 cifre a <strong className="text-amber-400 font-mono block mt-0.5">{email}</strong>
            </p>
          )}

          {authPromptReason && mode !== 'verify' && (
            <p className="mt-2 text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 font-mono">
              {authPromptReason}
            </p>
          )}
        </div>

        {/* Mode Switcher (Hidden during verification screen) */}
        {mode !== 'verify' && (
          <div className="flex rounded-xl bg-neutral-900/90 p-1 mb-5 border border-neutral-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setInfoMessage(''); }}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setInfoMessage(''); }}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Registrati
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0 mt-1" />
            <span className="flex-1 leading-relaxed">{error}</span>
          </div>
        )}

        {/* Info / Success Message */}
        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{infoMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE: VERIFY EMAIL (OTP SCREEN) */}
        {/* ============================================================ */}
        {mode === 'verify' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#120a03] border border-amber-500/50 shadow-[inset_0_0_20px_rgba(245,158,11,0.15)] text-center">
              <label 
                htmlFor="otp-code-input"
                className="block text-[11px] font-mono text-amber-400/90 uppercase tracking-widest font-bold mb-2"
              >
                Inserisci il Codice a 6 Cifre
              </label>

              <input
                id="otp-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={otpCode}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setOtpCode(cleaned);
                }}
                placeholder="000000"
                className="w-full py-3 px-4 text-center text-3xl sm:text-4xl font-mono font-black tracking-[0.4em] bg-black/80 border-2 border-amber-500/60 focus:border-amber-400 rounded-xl text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all placeholder:text-neutral-700"
              />

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-neutral-400 mt-2">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Codice valido per 15 minuti</span>
              </div>

              {previewCode && (
                <div className="mt-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-neutral-300">
                    Codice inviato: <strong className="text-amber-400 tracking-wider font-bold">{previewCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(previewCode)}
                    className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase transition-all cursor-pointer"
                  >
                    Inserisci
                  </button>
                </div>
              )}
            </div>

            <StudioButton
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={otpCode.length !== 6}
              className="w-full mt-2"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>Verifica Codice & Attiva Account</span>
            </StudioButton>

            {/* Resend & Edit Email Controls */}
            <div className="pt-3 border-t border-neutral-900 flex flex-col gap-2 text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isLoading}
                className={`text-xs font-mono transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  resendCooldown > 0
                    ? 'text-neutral-500 cursor-not-allowed'
                    : 'text-amber-400 hover:text-amber-300 underline'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>
                  {resendCooldown > 0
                    ? `Reinvia codice tra ${resendCooldown}s`
                    : 'Non hai ricevuto il codice? Invia di nuovo'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleBackToRegister}
                disabled={isLoading}
                className="text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Indirizzo errato? Modifica email</span>
              </button>
            </div>
          </form>
        ) : (
          /* ============================================================ */
          /* MODE: LOGIN OR REGISTER FORM */
          /* ============================================================ */
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <StudioInput
                label="Nome & Cognome / Nome d'Arte"
                type="text"
                required
                placeholder="Es. Marco Rossi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
            )}

            <div>
              <StudioInput
                label="Indirizzo Email Reale"
                type="email"
                required
                placeholder="nome@gmail.com, @outlook.it..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />
              {mode === 'register' && (
                <p className="text-[10px] font-mono text-neutral-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Riceverai un codice a 6 cifre per convalidare l'email. Email usa-e-getta bloccate.</span>
                </p>
              )}
            </div>

            <StudioInput
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
            />

            <StudioButton
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              <span>{mode === 'login' ? 'Entra nel Portale' : 'Invia Codice di Verifica'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </StudioButton>
          </form>
        )}

        {/* Google Sign In option (pre-verified 1-click authentication) */}
        {mode !== 'verify' && (
          <div className="mt-4">
            <StudioButton
              type="button"
              variant="rack"
              size="md"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Accedi con Google (Verifica Istantanea)</span>
            </StudioButton>
          </div>
        )}

        {/* Security Notice for Studio Master */}
        <div className="mt-6 pt-4 border-t border-neutral-900 text-center">
          <p className="text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Pannello Master riservato a <strong className="text-white">{MASTER_EMAIL}</strong></span>
          </p>
          <p className="text-[10px] font-mono text-neutral-500 mt-1">
            Per accedere come Amministratore Studio usa il pulsante <strong>"Accedi con Google"</strong> con l'account ufficiale dello studio.
          </p>
        </div>

      </div>
    </div>
  );
};
