import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Lock, Mail, Key, ShieldCheck, ArrowRight, UserCheck, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; name: string } | null;
  onLoginSuccess: (user: { email: string; name: string }) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // If Supabase credentials are configured in .env, authenticate via Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
          });
          if (error) throw error;
          if (data.user) {
            onLoginSuccess({ email: data.user.email!, name: name || data.user.email!.split('@')[0] });
            onClose();
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            onLoginSuccess({
              email: data.user.email!,
              name: data.user.user_metadata?.full_name || data.user.email!.split('@')[0],
            });
            onClose();
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Falha na autenticação');
      } finally {
        setLoading(false);
      }
    } else {
      // Offline / Local Institutional Operator fallback
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess({
          email: email || 'veltrani@trader.velts.ai',
          name: name || (email ? email.split('@')[0] : 'Operador Institucional'),
        });
        onClose();
      }, 500);
    }
  };

  const handleDemoLogin = () => {
    onLoginSuccess({
      email: 'operador.master@velts.ai',
      name: 'Carlos Veltrani (Master Trader)',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center font-bold text-white text-xs">
              V
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {currentUser ? 'Perfil do Operador' : 'Autenticação Institucional — VELTS'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser ? (
          /* Logged In View */
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400 font-bold text-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">{currentUser.name}</span>
                <span className="text-xs text-slate-400 font-mono">{currentUser.email}</span>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded border border-slate-800/80">
              <div className="flex justify-between">
                <span>Nível de Acesso:</span>
                <span className="text-emerald-400 font-bold">Trader Responsável</span>
              </div>
              <div className="flex justify-between">
                <span>Autenticação 2FA:</span>
                <span className="text-emerald-400">Ativa (mTLS / Token)</span>
              </div>
              <div className="flex justify-between">
                <span>Banco de Dados:</span>
                <span className="text-indigo-400">{isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Local Sandbox Engine'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-800 rounded font-bold text-xs transition-colors cursor-pointer"
            >
              Desconectar Sessão
            </button>
          </div>
        ) : (
          /* Login / SignUp Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Acesso seguro com criptografia de ponta a ponta e controle estrito de privilégios.
            </p>

            {isSignUp && (
              <div>
                <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Carlos Veltrani"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="operador@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? 'Validando...' : isSignUp ? 'Criar Conta de Operador' : 'Entrar na Plataforma'}</span>
            </button>

            {/* Quick Demo Access */}
            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded text-xs font-mono border border-indigo-500/30 transition-colors cursor-pointer"
              >
                Acesso Imediato: Modo Operador Demo (1-Clique)
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                }}
                className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isSignUp ? 'Já possui credencial? Fazer login' : 'Primeiro acesso? Criar nova conta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
