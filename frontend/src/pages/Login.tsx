import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Eye, EyeOff, Lock, LogIn, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { CosmicBackdrop } from '@/components/CosmicBackdrop';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isValidEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-shell flex relative overflow-hidden">
      <CosmicBackdrop />
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.34),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.18),transparent_28%),linear-gradient(135deg,#0b1a43_0%,#142b66_52%,#0d1224_100%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:120px_120px]" />
        <div className="absolute top-10 left-16 h-14 w-14 rounded-2xl bg-white/15 blur-[1px]" />
        <div className="absolute bottom-24 left-24 h-12 w-12 rounded-2xl bg-white/15 blur-[1px]" />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative z-10 text-center px-12 max-w-xl"
        >
          <div className="mx-auto mb-7 w-36 h-36 rounded-full bg-white/5 border border-white/10 shadow-[0_0_80px_rgba(59,130,246,0.22)] flex items-center justify-center backdrop-blur-sm">
            <svg viewBox="0 0 160 160" className="w-28 h-28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="robotShell" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="robotFace" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b1630" />
                  <stop offset="100%" stopColor="#172554" />
                </linearGradient>
                <linearGradient id="orbGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r="68" fill="#ffffff" fillOpacity="0.04" />
              <rect x="32" y="38" width="96" height="78" rx="28" fill="url(#robotShell)" />
              <rect x="45" y="50" width="70" height="50" rx="18" fill="url(#robotFace)" />
              <rect x="56" y="22" width="8" height="18" rx="4" fill="#dbeafe" />
              <circle cx="60" cy="18" r="10" fill="url(#orbGlow)" />
              <rect x="26" y="54" width="10" height="34" rx="5" fill="#b8c1d1" />
              <rect x="124" y="54" width="10" height="34" rx="5" fill="#b8c1d1" />
              <circle cx="65" cy="75" r="7" fill="#38bdf8" />
              <circle cx="95" cy="75" r="7" fill="#38bdf8" />
              <path d="M69 90c5 6 17 6 22 0" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-5xl font-extrabold text-white tracking-tight mb-5">ResearchHub</h2>
          <p className="text-xl text-slate-300 leading-relaxed max-w-lg mx-auto">
            Run AI-assisted literature analysis with a cinematic, research-first workspace.
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="w-full max-w-[540px] relative"
        >
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-sky-400/20 via-blue-500/10 to-cyan-400/20 blur-xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.40)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.11),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_24%)]" />

            <button
              type="button"
              onClick={() => setAssistantOpen((open) => !open)}
              className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-medium text-slate-100 shadow-lg transition hover:bg-white/12 hover:shadow-cyan-500/20"
            >
              <Bot className="h-4 w-4 text-sky-300" />
              Assistant
            </button>

            <AnimatePresence>
              {assistantOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-4 top-16 z-20 w-[min(280px,calc(100%-2rem))] rounded-2xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-200 shadow-2xl"
                >
                  <div className="mb-2 flex items-center gap-2 text-sky-300">
                    <Bot className="h-4 w-4" />
                    <span className="font-semibold">AI Assistant</span>
                  </div>
                  <p>Hi! I can help you log in or recover your account.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-10 p-6 sm:p-8 md:p-10">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/8 shadow-[0_0_30px_rgba(59,130,246,0.20)] lg:hidden">
                  <svg viewBox="0 0 120 120" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect x="18" y="25" width="84" height="68" rx="24" fill="#f8fafc" />
                    <rect x="29" y="35" width="62" height="44" rx="16" fill="#0f172a" />
                    <rect x="43" y="13" width="6" height="15" rx="3" fill="#dbeafe" />
                    <circle cx="46" cy="11" r="8" fill="#38bdf8" />
                    <circle cx="43" cy="58" r="5" fill="#38bdf8" />
                    <circle cx="77" cy="58" r="5" fill="#38bdf8" />
                    <path d="M49 71c4 4 10 4 14 0" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Welcome back</h1>
                <p className="mt-3 text-base text-slate-300">Sign in to continue your research</p>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100">Email</label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition group-focus-within:text-sky-300" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-14 border-white/10 bg-white/95 pl-11 pr-4 text-slate-900 shadow-none outline-none transition placeholder:text-slate-500 hover:border-sky-400/40 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100">Password</label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition group-focus-within:text-sky-300" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 border-white/10 bg-white/95 pl-11 pr-12 text-slate-900 shadow-none outline-none transition placeholder:text-slate-500 hover:border-sky-400/40 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-100"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-14 w-full border-0 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-base font-semibold text-white shadow-[0_16px_40px_rgba(59,130,246,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(59,130,246,0.38)]"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </span>
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-300">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-sky-300 transition hover:text-sky-200 hover:underline">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
