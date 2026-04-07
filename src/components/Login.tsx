import React, { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '291010') {
      onLogin();
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-teal-700 p-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-teal-600 rounded-full mb-4 shadow-inner">
            <Lock className="h-8 w-8 text-teal-100" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Acesso Restrito</h1>
          <p className="text-teal-100 mt-1">MediCad - Gestão Clínica</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Digite a senha de acesso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 border ${error ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-300'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-center text-lg tracking-widest`}
              placeholder="••••••"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-2 text-center font-medium animate-bounce">
                Senha incorreta. Tente novamente.
              </p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-teal-200 active:scale-[0.98]"
          >
            <LogIn className="h-5 w-5" />
            Entrar no Sistema
          </button>
          
          <p className="text-slate-400 text-[10px] text-center uppercase tracking-widest">
            Sistema de Prontuário Eletrônico Seguro
          </p>
        </form>
      </div>
    </div>
  );
}
